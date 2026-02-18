from pydantic import BaseModel
from enum import Enum
from datetime import datetime


class Occasion(str, Enum):
    birthday = "birthday"
    sympathy = "sympathy"
    anniversary = "anniversary"
    corporate = "corporate"
    thank_you = "thank_you"
    other = "other"


class Urgency(str, Enum):
    today = "today"
    this_week = "this_week"
    flexible = "flexible"


class Budget(str, Enum):
    low = "low"
    mid = "mid"
    high = "high"


class ExtractedIntent(BaseModel):
    occasion: Occasion | None = None
    urgency: Urgency | None = None
    recipient: str | None = None
    budget: Budget | None = None
    dietary: list[str] = []
    keywords: list[str] = []
    needs_clarification: bool = False
    clarifying_question: str | None = None
    confidence: float = 0.0


class EdibleProduct(BaseModel):
    sku: str
    name: str
    price: float
    image_url: str
    description: str
    tags: list[str] = []
    pdp_url: str


class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str


# Chat endpoint schemas
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    history: list[Message] = []


class ChatResponse(BaseModel):
    reply: str
    products: list[EdibleProduct] = []
    intent: ExtractedIntent
    session_id: str


# Search endpoint schemas
class SearchRequest(BaseModel):
    keyword: str


# Analytics endpoint schemas
class ClickRequest(BaseModel):
    session_id: str
    sku: str
    name: str
    position: int


class ConvertRequest(BaseModel):
    session_id: str


# Generic response
class StatusResponse(BaseModel):
    status: str = "ok"


# Session response (for debugging/testing)
class SessionResponse(BaseModel):
    id: str
    created_at: datetime
    converted: bool
