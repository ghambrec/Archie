"""analyzes the document and creates ai_summary and tags"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from src.generation.model import build_model, get_output_type


class Tags(BaseModel):
    name: str = Field(description="tag name, reuse an existing tag's name exactly if it fits")
    confidence: float = Field(ge=0, le=1, description="how confident you are that this tag fits")
    parent: str | None = Field(default=None, description="""
                                                        Only set when creating a new tag not listend in the existing tag list. 
                                                        the name of an existing tag this new tag should nest under, or null if it has no fitting parent. 
                                                        always null when reusing an existing tag."""
                               )
# description nachtraeglich evtl noch einbauen wenn tags zu ungenau sind. die dann mitgeben, damit llm weis wofuer ein tag genutzt wird

class DocumentInfos(BaseModel):
    summary: str = Field(description="2-4 sentence summary")
    tags: list[Tags] = Field(description="all tags that apply to the document")


SYSTEM_PROMPT = """
                    You analyze documents for a document management system.
                    You retrieve the document text and a language code.

                    Respond with a precise summary written in the given language.
                    If no language is given respond in the documents language.

                    Tags replace a traditional folder structure. Unlike folders, a document is not limited to a single category - assign every tag that
                    meaningfully applies. Prefer reusing an existing tag over inventing a new one. Only propose a new tag if none of the existing ones fit.
                    New tags may optionally nest under an existing tag as their parent. Set parent to null if the new tag has no fitting parent, and always
                    null then reusing a tag.

                    Example: Given existing tags "contracts" and "cars", for a leasing contract you might respond with tags:
                    [
                        {"name": "contracts", "confidence": 0.95, "parent": null},
                        {"name": "cars", "confidence": 0.9, "parent": null},
                        {"name": "leasing", "confidence": 0.85, "parent": "contracts"}
                    ]
                """

model = build_model()
agent = Agent(model, system_prompt=SYSTEM_PROMPT, output_type=get_output_type(DocumentInfos))

# token cap to ca 2000
_MAX_CHARS = 8000


async def analyze_doc(text: str, language: str | None) -> None:
    text_snippet = text[:_MAX_CHARS]
    prompt = f"Language: {language}\n\nDocument: {text_snippet}"
    result = await agent.run(prompt)
    print(f">>> SUMMARY: {result.output.summary}")
    for tag in result.output.tags:
        print(f"     - {tag.name,} confidence: {tag.confidence}, parent: {tag.parent}")
