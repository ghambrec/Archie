import logging
import pymupdf
import pymupdf4llm
import xlrd
import pytesseract
import pylibheif

from io import BytesIO
from PIL import Image
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from odf.namespaces import TABLENS, TEXTNS
from odf.opendocument import load as load_odf
from odf.teletype import extractText as extract_odf_text
from openpyxl import load_workbook
from charset_normalizer import from_bytes
# from pptx import Presentation


from src.config import settings

COLOR_REPRESENTATION = pymupdf.csRGB
INCLUDE_TRANSPARENCY = False


def xls_parser(document_bytes: bytes) -> str:
    """
    extracts XLX files
    """

    results = []

    try:
        book = xlrd.open_workbook(file_contents=document_bytes)
        try:
            for sheet in book.sheets():
                results.append(f"Sheet headline: {sheet.name}")
                for row_index in range(sheet.nrows):
                    cells = []
                    values = sheet.row_values(row_index)
                    for value in values:

                        text = "" if value is None else str(value)
                        cells.append(text)

                    if not any(text.strip() for text in cells):
                        continue
                    results.append("\t".join(cells))

                results.append("")

        finally:
            book.release_resources()

    except Exception:
        logging.exception(" XLX extration failed")
        raise

    return ("\n\n".join(results))


def xlsx_parser(document_bytes: bytes) -> str:
    """
    extracts XLSX files 
    """
    results = []
    try:
        with BytesIO(document_bytes) as stream:
            workbook = load_workbook(
                stream,
                read_only=True,
                data_only=True,
            )
            try:
                for sheet in workbook.worksheets:
                    results.append(f"Sheet: {sheet.title}")
                    for row in sheet.iter_rows(values_only=True):
                        cells = []

                        for value in row:
                            text = "" if value is None else str(value)
                            cells.append(text)

                        if not any(text.strip() for text in cells):
                            continue

                        results.append("\t".join(cells))

                    results.append("")
            finally:
                workbook.close()
    except Exception:
        logging.exception("XLS extraction failed")
        raise

    return "\n".join(results)


def docx_parser(document_bytes: bytes) -> str:
    try:
        results: list[str] = []

        with BytesIO(document_bytes) as stream:
            document = Document(stream)

            for block in document.iter_inner_content():
                if isinstance(block, Paragraph):
                    if block.text.strip():
                        results.append(block.text)

                elif isinstance(block, Table):
                    rows: list[str] = []

                    for row in block.rows:
                        cells = [cell.text for cell in row.cells]

                        if any(text.strip() for text in cells):
                            rows.append("\t".join(cells))

                    if rows:
                        results.append("\n".join(rows))

        return "\n\n".join(results)

    except Exception:
        logging.exception("DOCX extraction failed")
        raise


def _odt_blocks(parent) -> list[str]:
    """Extract blocks in order, including list items and nested table cells."""
    results: list[str] = []
    for child in parent.childNodes:
        tag = getattr(child, "qname", None)
        if tag in ((TEXTNS, "p"), (TEXTNS, "h")):
            text = extract_odf_text(child)
            if text.strip():
                results.append(text)
        elif tag == (TABLENS, "table"):
            rows = _odt_table_rows(child)
            if rows:
                results.append("\n".join(rows))
        elif tag is not None:
            results.extend(_odt_blocks(child))
    return results


def _odt_table_rows(parent) -> list[str]:
    results: list[str] = []
    for child in parent.childNodes:
        tag = getattr(child, "qname", None)
        if tag == (TABLENS, "table-row"):
            cells: list[str] = []
            for cell in child.childNodes:
                if getattr(cell, "qname", None) not in (
                    (TABLENS, "table-cell"), (TABLENS, "covered-table-cell")
                ):
                    continue
                text = "\n".join(_odt_blocks(cell))
                repeat = int(cell.getAttribute("numbercolumnsrepeated") or 1)
                cells.extend([text] * repeat)
            if any(text.strip() for text in cells):
                repeat = int(child.getAttribute("numberrowsrepeated") or 1)
                results.extend(["\t".join(cells)] * repeat)
        elif tag in (
            (TABLENS, "table-header-rows"),
            (TABLENS, "table-rows"),
            (TABLENS, "table-row-group"),
        ):
            results.extend(_odt_table_rows(child))
    return results


def odt_parser(document_bytes: bytes) -> str:
    """Extract ODT body text and tables; embedded images are not OCR processed."""
    try:
        with BytesIO(document_bytes) as stream:
            document = load_odf(stream)
            if document.mimetype != "application/vnd.oasis.opendocument.text":
                raise ValueError("Expected an OpenDocument text document")
            return "\n\n".join(_odt_blocks(document.text))
    except Exception:
        logging.exception("ODT extraction failed")
        raise


def pdf_parser(document_bytes: bytes) -> str:
    """
    Dispatches the pdf in pages.
    extracts the words from each page
    and runs a ocr modal over each page
    extracted words get appended as native pdf extraction text and
    ocr extraction text as native ocr extraction text 
    """
    results = []
    try:
        with pymupdf.open(stream=document_bytes, filetype="pdf") as document:
            logging.info("PDF opend: byetes= %d",  len(document_bytes))
            for page in document:
                logging.info("PDF opend: byetes= %d, page_number: %d %d",
                             len(document_bytes),
                             page.number + 1,
                             document.page_count,
                             )
                text = page.get_text("text")
                word_count = len(text.split())
                logging.debug("chars detected: %d ", word_count)

                logging.info("Pdf extration as markdown")
                text = pymupdf4llm.to_markdown(
                    document,
                    pages=[page.number],  # without the braces
                )

                image = page.get_pixmap(
                    dpi=settings.ocr_image_resultion_dpi,
                    colorspace=COLOR_REPRESENTATION,
                    alpha=INCLUDE_TRANSPARENCY,
                )
                ocr_text = ocr_image(image.tobytes("png"))

                if (text.strip()):
                    native_pdf = f"Native pdf extraction text: \n:, {text}"
                    results.append(native_pdf)
                if (ocr_text.strip()):
                    native_ocr = f"OCR extraction text: \n, {ocr_text}"
                    results.append(native_ocr)

    except Exception:
        logging.error("PDF extraction failed")
        raise
    return "\n\n".join(results)


def text_parser(document_bytes: bytes) -> str:
    """
    dispatches Text out of otc documents
    pictures do not get extracted of the document 
    """

    try:
        if not document_bytes:
            return ""

        match = from_bytes(document_bytes, cp_isolation=[
                           "utf_8", "cp1252"]).best()
        if match is None:
            raise RuntimeError(
                "Could not decode text as UTF-8 or Windows-1252")

        logging.info("Estimated text encoding: %s", match.encoding)
        result = str(match)
    except Exception:
        logging.exception("extraction docx failed")
        raise
    return result


def heic_image(heic_bytes: bytes) -> str:

    try:
        with pylibheif.HeifContext() as ctx:
            ctx.read_from_memory(heic_bytes)

            handle = ctx.get_primary_image_handle()
            img = handle.decode(
                pylibheif.HeifColorspace.RGB,
                pylibheif.HeifChroma.InterleavedRGB
            )
        pixels = img.get_plane(pylibheif.HeifChannel.Interleaved, False)

        text = pytesseract.image_to_string(
            pixels,
            lang="eng+deu+spa",
        )
        logging.info("OCR input type: %s", type(pixels))
        logging.info("OCR extracted characters: %d", len(text))
    except Exception:
        logging.exception("heic extraction failed")
        raise
    return text


def ocr_image(png_bytes: bytes) -> str:
    """
    OCR image suports german, english and spanisch character recognition 
    """

    logging.info("OCR received %d bytes", len(png_bytes))

    try:
        with Image.open(BytesIO(png_bytes)) as image:
            logging.debug("Image format=%s ",
                          image.format,)
            text = pytesseract.image_to_string(
                image,
                lang="eng+deu+spa",
            )
            logging.info("OCR input type: %s", type(image))
            logging.info("OCR extracted characters: %d", len(text))
    except Exception:
        logging.exception("Image OCR failed")
        raise
    return text

# def pptx_parser(document_bytes:bytes ) -> str:
#    """
#    extract pptx file
#    """
#    results = []
#    try:
#        with BytesIO(document_bytes) as byte_stream:

#            presStream = Presentation(byte_stream)
#            for  slide_index, slide in enumerate(presStream.slides):
#                results.append(f"Slide {slide_index}")
#                for shape in slide.shapes:
#                    if not shape.has_text_frame:
#                        continue:
