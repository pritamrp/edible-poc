import re
import json
from openai import OpenAI

from app.config import get_settings
from app.schemas import ExtractedIntent, EdibleProduct
from app.prompts.product_curator import CURATION_SYSTEM_PROMPT, build_curation_prompt

settings = get_settings()
client = OpenAI(api_key=settings.openai_api_key)

def sanitize_concierge_reply(text: str) -> str:
    """
    Normalize the LLM reply so the UI doesn't show Markdown artifacts like **bold**
    or list markers like "1." / "-".
    """
    if not text:
        return ""

    cleaned = text.replace("**", "").replace("*", "")

    lines: list[str] = []
    for line in cleaned.splitlines():
        line = re.sub(r"^\s*(?:[-•]\s+|\d+[.)]\s+)", "", line)
        lines.append(line.strip())

    return "\n".join(lines).strip()


def build_intent_summary(intent: ExtractedIntent) -> str:
    """Build a human-readable summary of the extracted intent."""
    parts = []

    if intent.occasion:
        parts.append(f"Occasion: {intent.occasion.value}")
    if intent.recipient:
        parts.append(f"Recipient: {intent.recipient}")
    if intent.urgency:
        parts.append(f"Urgency: {intent.urgency.value}")
    if intent.budget:
        parts.append(f"Budget: {intent.budget.value}")
    if intent.dietary:
        parts.append(f"Dietary requirements: {', '.join(intent.dietary)}")

    return "\n".join(parts) if parts else "General gift search"


def extract_recommended_skus(response_text: str, products: list[EdibleProduct]) -> list[EdibleProduct]:
    """Extract recommended products from the response by matching SKUs."""
    # Find SKUs mentioned in the response (format: SKU: XXXXX)
    # Edible catalog codes often contain dashes/underscores and are case-insensitive.
    sku_pattern = r"\bSKU:\s*([A-Za-z0-9_-]{3,40})\b"
    mentioned_skus = {s.strip() for s in re.findall(sku_pattern, response_text, re.IGNORECASE)}

    # Also try to match product names
    product_map = {p.sku.strip().upper(): p for p in products if p.sku}
    name_to_sku = {p.name.lower(): p.sku for p in products}

    recommended = []
    seen_skus = set()

    # First, add products whose SKUs are explicitly mentioned
    for sku in mentioned_skus:
        sku_key = sku.strip().upper()
        if sku_key in product_map and sku_key not in seen_skus:
            recommended.append(product_map[sku_key])
            seen_skus.add(sku_key)

    # If we didn't find SKUs, try matching by product name
    if not recommended:
        response_lower = response_text.lower()
        for name, sku in name_to_sku.items():
            sku_key = (sku or "").strip().upper()
            if name in response_lower and sku_key and sku_key not in seen_skus and sku_key in product_map:
                recommended.append(product_map[sku_key])
                seen_skus.add(sku_key)
                if len(recommended) >= 5:
                    break

    # If still nothing, return top products from the list
    if not recommended:
        recommended = products[:5]

    return recommended[:5]  # Max 5 products


def curate_products(
    intent: ExtractedIntent,
    products: list[EdibleProduct],
) -> tuple[str, list[EdibleProduct]]:
    """
    Stage 2: Curate products and generate a conversational response.

    Uses GPT-4o-mini for fast, cost-effective curation.
    """
    # Build the prompt
    intent_summary = build_intent_summary(intent)
    products_json = json.dumps(
        [p.model_dump() for p in products[:15]],  # Limit to top 15 for context
        indent=2,
    )
    user_message = build_curation_prompt(intent_summary, products_json)

    response = client.chat.completions.create(
        model=settings.curation_model,
        max_tokens=800,
        messages=[
            {"role": "system", "content": CURATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )

    reply = response.choices[0].message.content

    reply = sanitize_concierge_reply(reply or "")

    # Extract recommended products from the response
    recommended_products = extract_recommended_skus(reply, products)

    return reply, recommended_products
