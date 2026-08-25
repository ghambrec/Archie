"""analyzes the document and creates ai_summary and tags"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent, NativeOutput

from src.generation.model import build_model


SYSTEM_PROMPT = """
                    You analyze documents for a document management system.
                    You retrieve the document text and a language code.
                    Respond with a precise summary written in the given language code and a short list of topical tags.
                    If no language is given respond in the documents language.
                """


class DocumentInfos(BaseModel):
    summary: str = Field(description="2-4 sentence summary")
    tags: list[str] = Field(description="multiple topical tags")


model = build_model()
agent = Agent(model, system_prompt=SYSTEM_PROMPT, output_type=NativeOutput(DocumentInfos))  # fuynktioniert native output bei openrouter??

# token cap to ca 2000
_MAX_CHARS = 8000


async def analyze_doc(text: str, language: str | None) -> None:
    text_snippet = text[:_MAX_CHARS]
    prompt = f"Language: {language}\n\nDocument: {text_snippet}"
    result = await agent.run(prompt)
    print(f">>> SUMMARY: {result.output.summary}")
    print(f">>> TAGS   : {result.output.tags}")
