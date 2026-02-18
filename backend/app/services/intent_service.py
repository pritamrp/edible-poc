import json
from openai import OpenAI

from app.config import get_settings
from app.schemas import ExtractedIntent, Occasion, Urgency, Budget
from app.prompts.intent_extractor import INTENT_SYSTEM_PROMPT

settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)


def parse_intent_response(response_text: str) -> ExtractedIntent:
    """Parse the JSON response from the intent extraction model."""
    try:
        # Clean up response - remove markdown code blocks if present
        text = response_text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip()

        data = json.loads(text)

        # Parse enums carefully
        occasion = None
        if data.get("occasion"):
            try:
                occasion = Occasion(data["occasion"])
            except ValueError:
                occasion = Occasion.other

        urgency = None
        if data.get("urgency"):
            try:
                urgency = Urgency(data["urgency"])
            except ValueError:
                pass

        budget = None
        if data.get("budget"):
            try:
                budget = Budget(data["budget"])
            except ValueError:
                pass

        return ExtractedIntent(
            occasion=occasion,
            urgency=urgency,
            recipient=data.get("recipient"),
            budget=budget,
            dietary=data.get("dietary", []),
            keywords=data.get("keywords", []),
            needs_clarification=data.get("needs_clarification", False),
            clarifying_question=data.get("clarifying_question"),
            confidence=float(data.get("confidence", 0.0)),
        )

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        # Return a low-confidence intent asking for clarification
        return ExtractedIntent(
            needs_clarification=True,
            clarifying_question="I'd love to help you find the perfect gift! What's the occasion?",
            confidence=0.0,
        )


def extract_intent(messages: list[dict]) -> ExtractedIntent:
    """
    Stage 1: Extract structured intent from conversation history.

    Uses GPT-4o for strong reasoning capabilities.
    """
    # Convert messages to OpenAI format
    openai_messages = [{"role": "system", "content": INTENT_SYSTEM_PROMPT}]
    openai_messages.extend(messages)

    response = client.chat.completions.create(
        model=settings.intent_model,
        max_tokens=500,
        messages=openai_messages,
    )

    response_text = response.choices[0].message.content
    return parse_intent_response(response_text)
