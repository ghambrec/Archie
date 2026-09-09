import logging
from enum import Enum, auto 
#import filetype 

#import libmagic
import magic

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



def dectect_file_type(raw:bytes) -> FileType:
    """
    
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

    
    return dectected_type



def extract_text(raw: bytes) -> str:
    """
    logic for extraction pdf , openTraise NotImplementedError("PDF extraction is not implemented yet")
ext , 
    seperate logic 

    dateitypen:
    - plain text (verschiedene codierungen, z.b. utf8 oder 8859-1)
    - pdf mit text layer
    - pdf ohne text layer
    - bilder (jpg, png, heic)
    - optional: xlsx, docx


    fallback
    wenn ocr verdeachtiges wenig chars 
    dann auf Vison modell - beschreiben lassen 
    """

   

    # check if it can read more than 10 chars plausibel 
   

    dectected_type = dectect_file_type(raw)
    logging.info("FileType %s", dectected_type.name )

    if dectected_type == FileType.PDF:
        text_buffer = pdf_parser(raw)



    return raw.decode("utf-8")




def pdf_parser(raw:bytes) -> str:
    """
    dispatch pdfs 
    """
    logging.error("Pdf extration not implemented")
    raise NotImplementedError("PDF extraction is not implemented yet")

def test_parser(raw:bytes) -> str:

    raw.decode("utf-8")
    
