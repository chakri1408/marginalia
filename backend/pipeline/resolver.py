import re

from clients import complete

_PRONOUNS = r"\b(he|she|him|her|his|hers|they|them|their|theirs|it|its|that|those|these|this)\b"

_RESOLVE_PROMPT = """You rewrite a follow-up question into a standalone question using the conversation history.

RULES:
- Only resolve references that depend on the history (pronouns like "her", or fragments like "what about 2023").
- A pronoun refers to the MOST RECENTLY discussed person or entity, never an earlier one.
- If the user corrects or contrasts ("no, not X but Y", "I meant Y"), resolve to the NEWLY specified entity and ignore the rejected one.
- If the new question is already self-contained, return it EXACTLY as-is, unchanged.
- Never add a subject from the history to a question that already names its own subject.
- Output ONLY the rewritten question, nothing else.

EXAMPLES:
History:
User: Who is Avery Lancaster?
Assistant: Avery Lancaster is the CEO of Insurellm.
New question: what is her salary
Standalone: What is Avery Lancaster's salary?

History:
User: who attended the university of manchester
Assistant: Jessica Liu attended the University of Manchester.
New question: what is her salary
Standalone: What is Jessica Liu's salary?

History:
User: what is her salary
Assistant: Avery Lancaster's salary is $225,000.
New question: not avery's but the one who attended manchester university
Standalone: What is the salary of the person who attended the University of Manchester?

History:
User: Who is Avery Lancaster?
Assistant: Avery Lancaster is the CEO of Insurellm.
New question: who attended manchester university
Standalone: who attended manchester university

History:
{history}
New question: {question}
Standalone:"""


def _looks_referential(question: str) -> bool:
    q = question.strip().lower()
    if len(q.split()) <= 6:
        return True
    if re.search(_PRONOUNS, q):
        return True
    if re.match(r"^(and|what about|how about|what else|then|no|not|actually|i meant)\b", q):
        return True
    return False


def _format_history(history: list[dict], max_turns: int = 2) -> str:
    recent = history[-max_turns:]
    lines = []
    for turn in recent:
        role = "User" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {turn.get('content', '').strip()}")
    return "\n".join(lines)


def resolve_query(question: str, history: list[dict] | None) -> str:
    if not history or not _looks_referential(question):
        return question
    try:
        prompt = _RESOLVE_PROMPT.format(history=_format_history(history), question=question)
        rewritten = complete([{"role": "user", "content": prompt}]).strip()
        return rewritten or question
    except Exception:
        return question