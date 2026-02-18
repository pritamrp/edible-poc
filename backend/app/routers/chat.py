from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models import Session as DBSession, Conversation, IntentLog
from app.schemas import ChatRequest, ChatResponse, ExtractedIntent, Message
from app.services.intent_service import extract_intent
from app.services.curation_service import curate_products
from app.services.edible_client import search_products

router = APIRouter()


def get_or_create_session(db: Session, session_id: str | None) -> DBSession:
    """Get existing session or create a new one."""
    if session_id:
        session = db.query(DBSession).filter(DBSession.id == session_id).first()
        if session:
            return session

    # Create new session
    session = DBSession()
    db.add(session)
    db.flush()
    return session


def save_conversation(db: Session, session_id: str, role: str, content: str) -> Conversation:
    """Save a message to the conversation history."""
    conversation = Conversation(session_id=session_id, role=role, content=content)
    db.add(conversation)
    db.flush()
    return conversation


def save_intent_log(db: Session, session_id: str, intent: ExtractedIntent) -> IntentLog:
    """Save extracted intent to the database."""
    intent_log = IntentLog(
        session_id=session_id,
        occasion=intent.occasion.value if intent.occasion else None,
        urgency=intent.urgency.value if intent.urgency else None,
        recipient=intent.recipient,
        budget=intent.budget.value if intent.budget else None,
        dietary=intent.dietary,
        keywords=intent.keywords,
        confidence=intent.confidence,
    )
    db.add(intent_log)
    db.flush()
    return intent_log


def build_history_for_llm(history: list[Message], new_message: str) -> list[dict]:
    """Build conversation history in format for Anthropic API."""
    messages = []
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": new_message})
    return messages


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Main chat endpoint for the gift concierge.

    Flow:
    1. Get or create session
    2. Save user message
    3. Extract intent (Stage 1)
    4. If clarification needed, return question
    5. Search Edible catalog with keywords
    6. Curate products (Stage 2)
    7. Save assistant reply
    8. Return response
    """
    try:
        # 1. Get or create session
        session = get_or_create_session(db, request.session_id)

        # 2. Save user message
        save_conversation(db, session.id, "user", request.message)

        # 3. Build conversation history and extract intent
        messages = build_history_for_llm(request.history, request.message)
        intent = extract_intent(messages)

        # 4. If clarification needed, return the question
        if intent.needs_clarification and intent.clarifying_question:
            reply = intent.clarifying_question
            save_conversation(db, session.id, "assistant", reply)
            save_intent_log(db, session.id, intent)

            return ChatResponse(
                reply=reply,
                products=[],
                intent=intent,
                session_id=session.id,
            )

        # 5. Search for products if we have keywords and sufficient confidence
        products = []
        if intent.keywords and intent.confidence >= 0.6:
            products = search_products(intent.keywords)

        # 6. Curate products and generate response
        if products:
            reply, curated_products = curate_products(intent, products)
        else:
            # No products found or low confidence - ask for more info
            reply = "I'd love to help you find the perfect gift! Could you tell me a bit more about the occasion and who you're shopping for?"
            curated_products = []

        # 7. Save assistant reply and intent log
        save_conversation(db, session.id, "assistant", reply)
        save_intent_log(db, session.id, intent)

        return ChatResponse(
            reply=reply,
            products=curated_products,
            intent=intent,
            session_id=session.id,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
