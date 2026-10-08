import logging
import magic
from typing import Callable

from src.ingestion.file_parser import (
    text_parser,
    pdf_parser,
    ocr_image,
    heic_image,
    docx_parser,
    xlsx_parser,
    xls_parser
)


class UnsupportedFileTypeError(Exception):
    def __init__(self, mime_type: str):
        self.mime_type = mime_type
        super().__init__(f"no parser for mime type: {mime_type}")


class NoTextExtracedError(Exception):
    def __init__(self):
        super().__init__(f"could not extract any text")


def extract_text(raw: bytes) -> str:
    mime_type = magic.from_buffer(raw, mime=True)
    parser = PARSERS.get(mime_type)
    if parser is None:
        logging.info("mime type %s: no parser found, skip ai pipeline", mime_type)
        raise UnsupportedFileTypeError(mime_type)
    logging.info("mime type %s -> %s", mime_type, parser.__name__)
    return parser(raw)


Parser = Callable[[bytes], str]
PARSERS: dict[str, Parser] = {
    "text/plain": text_parser,
    "application/pdf": pdf_parser,
    "image/png": ocr_image,
    "image/jpeg": ocr_image,
    "image/heic": heic_image,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": docx_parser,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": xlsx_parser,
    "application/vnd.ms-excel": xls_parser,
}
