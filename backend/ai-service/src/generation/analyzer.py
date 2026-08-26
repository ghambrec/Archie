"""analyzes the document and creates ai_summary and tags"""

from __future__ import annotations

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from typing import Literal

from src.generation.model import build_model, get_output_type


class Tags(BaseModel):
    name: str = Field(description="tag name, reuse an existing tag's name exactly if it fits")
    facet: Literal["domain", "doctype"] = Field(description="whether this is a subject-area tag or a document-form tag")
    confidence: float = Field(ge=0, le=1, description="how confident you are that this tag fits")
    parent: str | None = Field(default=None, description="""
                                                        Only set when creating a new tag not listet in the existing tag list. 
                                                        the name of an existing tag this new tag should nest under, or null if it has no fitting parent. 
                                                        always null when reusing an existing tag.
                                                        """
                               )
# wie gut funktioniert das mit der confidence?

class DocumentInfos(BaseModel):
    summary: str = Field(description="2-4 sentence summary of what the document is about. its prupose, key facts, parties involved. never mention or list the choosen tags")
    tags: list[Tags] = Field(description="1-3 domain tags plus exactly 1 doctype tag that fits to the document", max_length=5)


SYSTEM_PROMPT = """
                    You analyze documents for a document management system.
                    You retrieve the document text, a language code and a list of existing tags. Each tag has a fecat: 'domain' (life area / subject) or
                    'doctype' (kind of document).

                    SUMMARY
                    Respond with a precise summary written in the given language. If no language is given respond in the documents language.
                    Describe what the document actually is about. Its purpose, key facts, and the parties involved.

                    TAGS
                    Tags replace a traditional folder structure - combine broad existing tags instead of inventing a specific one for a combination that
                    doesn't exist yet. Examples:
                        car insurance policy            -> vehicles + insurance + contract
                        invoice from that same insurer  -> vehicles + insurance + invoice
                        electricity bill                -> housing + utilities + invoice
                        payspli                         -> work + statement
                        vaccination record              -> health + certificate
                        flight booking                  -> travel + ticket

                    Never invent a tag that merges two facets ('vehicle-insurance') or that names a specific company, product, person, date or amount.
                    Only propose a new tag if no existing combination fits at all - it must declare its facet and may nest under an existing domain tag as parent.
                    Use 'other' only if no domain tag applies at all.
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
