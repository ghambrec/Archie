import logging
from enum import Enum, auto 
#import filetype 

#import libmagic
import magic
import pymupdf
import pymupdf4llm

from io import BytesIO
from PIL import Image
from docx import Document
from openpyxl import load_workbook

import pytesseract 
import pylibheif




from charset_normalizer import from_bytes

from src.config import settings
COLOR_REPRESENTATION = pymupdf.csRGB
INCLUDE_TRANSPARENCY = False


class FileType(Enum):
    UNKNOWN = auto()
    TEXT = auto()
    PDF = auto()
    JPEG = auto()
    JPX = auto()
    PNG = auto()
    HEIC = auto()
    DOC = auto()
    DOCX = auto()
    ODT = auto()
    XLS = auto()
    XLSX = auto()
    ODS = auto()
    PPT = auto()
    PPTX = auto()
    ODP = auto()



def extract_text(raw: bytes) -> str:
    """
    bytes come as a bytesobject, always needs to be converted in a bytes stream
    extracts TEXT, PDF, PNG, JPEG, HEIC, DOCX and XLSX, 
    and uses for pdfs, png, heic images an OCR Modasl
    """



    dectected_type = dectect_file_type(raw)
    logging.info("FileType %s", dectected_type.name )

    if dectected_type == FileType.TEXT:
        return text_parser(raw)

    if dectected_type == FileType.PDF:
        return pdf_parser(raw)

    if dectected_type in (FileType.PNG, FileType.JPEG):
        return ocr_image(raw)

    if dectected_type in ( FileType.HEIC):
        return heic_image(raw)

    if dectected_type == FileType.DOCX:
        return docx_parser(raw)


    if dectected_type == FileType.XLSX:
        return xlsx_parser(raw)
    
    raise Exception("Document type not supported")



def dectect_file_type(raw:bytes) -> FileType:
    """
    inspect magic bytes with magic libary and return a enum fileType
    """


    mime_type = magic.from_buffer(raw, mime=True)
    
    if mime_type is None:
        logging.error("Cannot guess file type!")
        return FileType.UNKNOWN
    elif mime_type == "application/pdf":
        detected_type = FileType.PDF
    elif mime_type == "text/plain":
        detected_type = FileType.TEXT
    elif mime_type == "image/jpeg":
        detected_type = FileType.JPEG
    elif mime_type == "image/jpx":
        detected_type = FileType.JPX
    elif mime_type == "image/png":
        detected_type = FileType.PNG
    elif mime_type == "image/heic":
        detected_type = FileType.HEIC
    elif mime_type == "application/msword":
        detected_type = FileType.DOC
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        detected_type = FileType.DOCX
    elif mime_type == "application/vnd.oasis.opendocument.text":
        detected_type = FileType.ODT
    elif mime_type == "application/vnd.ms-excel":
        detected_type = FileType.XLS
    elif mime_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        detected_type = FileType.XLSX
    elif mime_type == "application/vnd.oasis.opendocument.spreadsheet":
        detected_type = FileType.ODS
    elif mime_type == "application/vnd.ms-powerpoint":
        detected_type = FileType.PPT
    elif mime_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        detected_type = FileType.PPTX
    elif mime_type == "application/vnd.oasis.opendocument.presentation":
        detected_type = FileType.ODP
    else:
        detected_type = FileType.UNKNOWN
    return detected_type


def xlsx_parser(raw)-> str:
    """
    reads XLS files 
    """
    results = []

    with BytesIO(raw) as stream:
        workbook = load_workbook(
            stream,
            read_only=True, 
            date_only=True,
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

    return "\n".join(results)
    


def docx_parser(raw:bytes) -> str:
    """
    read docx documents, screenshots will be missed,
      would require to create a pdf file with libreoffice and than only run the ocr modal  over it
    """
    
    results = []
    logging.info("docx file gets read , but no screenshots will be missed")
    with BytesIO(raw) as stream:
        document = Document(stream)
        paragraphs = document.paragraphs

        logging.info("DOCX: found %d body paragraphs", len(paragraphs))

        results.append(paragraphs)
        return "\n\n".join(results)


def pdf_parser(raw:bytes) -> str:
    """
    dispatch pdfs 
    check each page and call the ocr model if less less then 20 chars get read
    """
    results = []

    with pymupdf.open(stream=raw, filetype="pdf") as document:
        for page in document:
            text = page.get_text("text")
            word_count = len(text.split())
            logging.info("chars dectected: %d " , word_count)

            if word_count < settings.ocr_min_chars:
                image = page.get_pixmap(
                    dpi = settings.ocr_image_resultion_dpi,
                    colorspace = COLOR_REPRESENTATION,
                    alpha = INCLUDE_TRANSPARENCY,
                )
                text_extracted = ocr_image(image.tobytes("png"))
                char_count_image = sum( char.isalnum() for char in text_extracted )
                if char_count_image < settings.ocr_min_chars:
                    logging.error("Nearly no chars extracted form image by OCR")


            else:
                logging.info("Pdf extration as markdown")
                text_extracted = pymupdf4llm.to_markdown(page)

            results.append(text_extracted)

    return "\n\n".join(results)


def text_parser(raw: bytes) -> str:
    if not raw:
        return ""

    match = from_bytes(raw, cp_isolation=["utf_8", "cp1252"]).best()
    if match is None:
        raise RuntimeError("Could not decode text as UTF-8 or Windows-1252")

    logging.info("Estimated text encoding: %s", match.encoding)
    return str(match)



def heic_image(heic_bytes: bytes ) -> str:
    with pylibheif.HeifContext() as ctx:
        ctx.read_from_memory('heic_bytes')

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
    return text

def ocr_image(png_bytes: bytes) -> str:
    with Image.open(BytesIO(png_bytes)) as image:
        text = pytesseract.image_to_string(
            image,
            lang="eng+deu+spa",
            )
        logging.info("OCR input type: %s", type(image))
        logging.info("OCR extracted characters: %d", len(text))
        return text
    
