import logging
import pymupdf
import pymupdf4llm
import xlrd
import pytesseract
import pylibheif

from io import BytesIO
from PIL import Image
from docx import Document
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
    """
    read docx documents, screenshots will be missed,
      would require to create a pdf file with libreoffice and than only run the ocr modal  over it
    """
    try:
        results = []
        logging.info("docx file gets read , but no screenshots will be missed")
        with BytesIO(document_bytes) as stream:
            document = Document(stream)
            paragraphs = document.paragraphs

            logging.info("DOCX: found %d body paragraphs", len(paragraphs))

            results.append(paragraphs)

    except Exception:
        logging.exception("docx extraction failed")
        raise

    return "\n\n".join(results)


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
