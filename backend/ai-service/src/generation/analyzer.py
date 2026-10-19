"""analyzes the document and creates ai_summary and tags"""

from __future__ import annotations
import logging

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.settings import ModelSettings
from typing import Literal
from datetime import date

from src.generation.model import build_model, get_output_type, get_max_input_chars

logger = logging.getLogger(__name__)

class Reminder(BaseModel):
    title: str = Field(description="short subject line for the reminder email, max ~8 words, e.g. 'Pay electricity bill from Stadtwerke'")
    message: str = Field(description="self-contained reminder text with all actionable details from the document: absolute due date, amount, recipient, IBAN, payment reference, invoice/customer/contract number. only use stated values. more data is better than too little data")
    due_date: date = Field(description="the deadline by which the action must be done, in ISO format YYYY-MM-DD. resolve relative deadlines ('within 14 days') using the document date, or today's date if the document has no date")

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
    description: str | None = Field(default=None, description="Only set when creating a new tag not listet in the existing tag list. Describe here why you created this tag and what this tag is about.")


class DocumentInfos(BaseModel):
    summary: str = Field(description="2-4 sentence summary of what the document is about. its prupose, key facts, parties involved. never mention or list the choosen tags")
    tags: list[Tags] = Field(description="1-3 domain tags plus exactly 1 doctype tag that fits to the document", max_length=5)
    reminders: list[Reminder] = Field(description="reminders for concrete deadlines the user must act on. empty list if the document has no actionable deadline", default_factory=list, max_length=3)


SYSTEM_PROMPT = """
                    You analyze documents for a document management system.
                    You retrieve the document text, a language code and a list of existing tags. Each tag has a fecat: 'domain' (life area / subject) or
                    'doctype' (kind of document).

                    GENERALLY
                    Write text in the given language. If no language is given use the documents language.

                    SUMMARY
                    Respond with a precise summary. Describe what the document actually is about. Its purpose, key facts, and the parties involved.

                    TAGS
                    Tags replace a traditional folder structure - combine broad existing tags instead of inventing a specific one for a combination that
                    doesn't exist yet. Examples:
                        car insurance policy            -> vehicles + insurance + contract
                        invoice from that same insurer  -> vehicles + insurance + invoice
                        electricity bill                -> utilities + invoice
                        payspli                         -> work + statement
                        vaccination record              -> health + certificate
                        flight booking                  -> travel + ticket

                    When both a broad domain tag and one of its more specific children apply, use only the more specific child - never assign a 
                    tag together with its own parent.

                    Never invent a tag that merges two facets ('vehicle-insurance') or that names a specific company, product, person, date or amount.
                    Only propose a new tag if no existing combination fits at all - it must declare its facet and may nest under an existing domain tag as parent.
                    Use 'other' only if no domain tag applies at all.

                    REMINDERS
                    Create a reminder only if the document requires the user to actively do something by a specific deadline.
                    If there is no such deadline, return an empty list - most documents need no reminder.
                    Examples:
                        invoice / bill with payment deadline        -> yes: pay by due date
                        contract with cancellation period           -> yes: cancel by last possible date
                        tax notice with objection period            -> yes: object or pay by deadline
                        ID card / passport with expiry date         -> yes: renew before expiry
                        certificate / school report / diploma       -> no
                        payslip / bank statement                    -> no
                        already paid receipt                        -> no
                        flight booking (date is an event, no task)  -> no

                    Never create a reminder for dates in the past, for informational dates (issue date, birth date, period covered)
                    or when the deadline is unclear. Never invent a date that is not stated or clearly derivable from the document.

                    REMINDER-MESSAGE
                    The message is sent as an email and must be self-contained - the user should be able to act without opening the document.
                    Include every actionable detail stated in the document, for example:
                        - the concrete due date as an absolute date (never 'within 14 days' or 'by the due date')
                        - amount and currency
                        - recipient / payee name
                        - IBAN, BIC, payment reference, invoice number, customer number, contract number
                        - what exactly has to be done (pay, cancel, renew, submit)
                    Only use details that are stated in the document - never invent or guess missing values.
                    Example:
                        "Rechnung Nr. 2026-08-4471293 von Stadtwerke Musterstadt über 65,27 EUR bis 30.10.2026 überweisen.
                        Empfänger: Stadtwerke Musterstadt, IBAN DE12 3456 7890 1234 5678, Verwendungszweck: 2026-08-4471293."
                """

model = build_model()
agent = Agent(
    model, 
    system_prompt=SYSTEM_PROMPT, 
    output_type=get_output_type(DocumentInfos),
    model_settings=ModelSettings(temperature=0.5),
    retries={"output": 3}
    )

# token cap depending on choosen llm provider
_MAX_CHARS = get_max_input_chars()


def _format_tags(tags: list[dict]) -> str:
    domain = [t for t in tags if t["facet"] == "domain"]
    doctype = [t for t in tags if t["facet"] == "doctype"]

    # domain
    lines = ["Domain tags:"]
    for t in domain:
        if t["parent_name"]:
            lines.append(f"- {t['name']} ({t['description']}) - parent: {t['parent_name']}")
        else:
            lines.append(f"- {t['name']} ({t['description']})")

    # doctype
    lines.append("Doctype tags:")
    lines += [f"- {t['name']} ({t['description']})" for t in doctype]
    return "\n".join(lines)


async def analyze_doc(text: str, language: str | None, tags: list[dict]) -> DocumentInfos:
    text_snippet = text[:_MAX_CHARS]
    prompt = f"Today: {date.today().isoformat()}\nLanguage: {language}\n\nExisting Tags:\n{_format_tags(tags)}\n\nDocument:\n{text_snippet}"
    logger.debug(f">>> PROMPT:\n{prompt}")
    result = await agent.run(prompt)
    logger.debug(f">>> SUMMARY: {result.output.summary}")
    for tag in result.output.tags:
        logger.debug(f"     - {tag.name}, confidence: {tag.confidence}, parent: {tag.parent}")
    return result.output
