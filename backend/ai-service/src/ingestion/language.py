from __future__ import annotations

from lingua import Language, LanguageDetectorBuilder

_LANGUAGES = [Language.GERMAN, Language.ENGLISH, Language.SPANISH]

_detector = LanguageDetectorBuilder.from_languages(*_LANGUAGES).build()

def detect_language(text: str) -> str | None:
    text_snippet = text[:1000]
    language = _detector.detect_language_of(text_snippet)
    return language.iso_code_639_1.name.lower() if language else None
