# Edible Arrangements — AI Gift Concierge POC
## Claude Code Plan Mode Spec

---

## Project Goal

Build a full-stack AI-powered gift discovery experience that helps customers who could not find what they were looking for convert into buyers. The AI understands gifting intent (occasion, recipient, urgency), fetches real products from Edible's catalog, and guides — not forces — the customer toward a confident purchase decision.

**Primary metric:** Conversion rate (session ends in a product click-through to PDP/cart)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│   Next.js 14 (App Router) + Tailwind CSS                │
│   - Gift Concierge Chat UI                              │
│   - Product Card Grid                                   │
│   - Occasion Quick-Start Buttons                        │
│   localhost:3000                                        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (fetch to backend)
┌────────────────────────▼────────────────────────────────┐
│                      BACKEND                            │
│   Python FastAPI                                        │
│   localhost:8000                                        │
│                                                         │
│   POST /api/chat        — main conversation endpoint    │
│   POST /api/search      — proxy to Edible catalog API   │
│   POST /api/analytics/* — log events                    │
└──────────┬─────────────────────────┬────────────────────┘
           │                         │
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│   Anthropic API     │   │   Edible Search API          │
│   claude-opus-4-6   │   │   POST /api/search/          │
│   (intent stage)    │   │   { keyword: string }        │
│   claude-haiku-4-5  │   └─────────────────────────────┘
│   (curation stage)  │
└─────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────┐
│                     DATABASE                            │
│   PostgreSQL via SQLAlchemy 2.0 (async)                 │
│                                                         │
│   Tables:                                               │
│   - sessions       (anonymous session tracking)         │
│   - conversations  (message history per session)        │
│   - intent_logs    (extracted intents, anonymized)      │
│   - product_clicks (what was clicked after recommend)   │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | React-based UI, fast styling |
| Backend | FastAPI (Python 3.11+) | Async, auto OpenAPI docs, Pydantic integration |
| ORM | SQLAlchemy 2.0 + Alembic | Python standard, clean async support |
| Database | PostgreSQL (local dev via Docker) | Relational, good for session/event logging |
| AI SDK | `anthropic` Python SDK | Direct, no abstraction layer |
| HTTP Client | `httpx` | Async HTTP client for Edible API calls |
| Validation | Pydantic v2 | Type safety for API contracts and prompt I/O |
| Env | `.env` | `ANTHROPIC_API_KEY`, `DATABASE_URL` |

---

## Database Schema

```python
# app/models.py

from datetime import datetime
from sqlalchemy import String, Boolean, Float, Integer, ForeignKey, ARRAY, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from nanoid import generate

def generate_id() -> str:
    return generate(size=21)

class Base(DeclarativeBase):
    pass

class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    converted: Mapped[bool] = mapped_column(Boolean, default=False)

    conversations: Mapped[list["Conversation"]] = relationship(back_populates="session")
    intent_logs: Mapped[list["IntentLog"]] = relationship(back_populates="session")
    product_clicks: Mapped[list["ProductClick"]] = relationship(back_populates="session")

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(10))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="conversations")

class IntentLog(Base):
    __tablename__ = "intent_logs"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    occasion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(100), nullable=True)
    budget: Mapped[str | None] = mapped_column(String(10), nullable=True)
    dietary: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    keywords: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="intent_logs")

class ProductClick(Base):
    __tablename__ = "product_clicks"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id"))
    sku: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)  # 1-5 in recommendation list
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="product_clicks")
```

---

## AI Pipeline Design

### Two-Stage Pipeline (NOT a single monolithic prompt)

```
User Message
     │
     ▼
┌─────────────────────────────────────┐
│  STAGE 1: Intent Extraction         │
│  Model: claude-opus-4-6             │  ← Strong reasoning, high accuracy
│  Input: conversation history        │
│  Output: structured JSON intent     │
│  Target latency: < 600ms            │
└────────────────┬────────────────────┘
                 │ intent JSON
                 ▼
        Edible /api/search/ call
        (1-3 keyword queries in parallel)
                 │ raw products array
                 ▼
┌─────────────────────────────────────┐
│  STAGE 2: Product Curation          │
│  Model: claude-haiku-4-5            │  ← Fast, cheap, simpler task
│  Input: intent + raw products       │
│  Output: top 3-5 picks + reasoning  │
│  Target latency: < 700ms            │
└─────────────────────────────────────┘
         │
         ▼
Total target: < 1.5 seconds end-to-end
```

### Stage 1 — Intent Extraction Prompt

```python
# app/prompts/intent_extractor.py

INTENT_SYSTEM_PROMPT = """
You are an intent extraction engine for a gift shop. Your job is to analyze
a customer conversation and extract structured gifting intent.

Think step by step (chain of thought) before producing output:
1. What occasion is this for?
2. Who is the recipient and what is their relationship to the buyer?
3. How urgent is delivery?
4. Are there any dietary or product constraints mentioned?
5. What search keywords would best find relevant products?

IMPORTANT: Only extract what the customer has actually said.
Use null for unknown fields. Do not guess or infer beyond what is stated.

Output ONLY valid JSON matching this exact schema:
{
  "occasion": "birthday" | "sympathy" | "anniversary" | "corporate" | "thank_you" | "other" | null,
  "urgency": "today" | "this_week" | "flexible" | null,
  "recipient": string | null,
  "budget": "low" | "mid" | "high" | null,
  "dietary": string[],
  "keywords": string[],   // 1-3 search terms to query the catalog
  "needs_clarification": boolean,
  "clarifying_question": string | null,  // Ask only if critical info is missing
  "confidence": number  // 0-1
}
""".strip()
```

### Stage 2 — Product Curation Prompt

```python
# app/prompts/product_curator.py

CURATION_SYSTEM_PROMPT = """
You are a gift concierge for Edible Arrangements.
Your job is to select the best 3-5 products from the provided catalog
and explain why each fits the customer's needs.

STRICT RULES — you will be audited on these:
1. Only reference products in the CATALOG provided to you. Never invent products.
2. Only use attributes present in the product data (name, price, description, tags).
   Do not claim a product is "vegan" or "nut-free" unless that tag exists in the data.
3. Do not make claims about delivery timing or availability.
4. Do not upsell or pressure. Present options, then step back.
5. Keep each product explanation to 1-2 sentences focused on why it fits THIS customer.

After presenting options, end with:
"Let me know if you'd like more details on any of these, or if none of these feel right."
Do not continue beyond that unless the customer responds.

Tone: Warm, helpful, human. Like a knowledgeable friend — not a salesperson.
""".strip()
```

---

## API Routes (FastAPI)

### `POST /api/chat`

```python
# app/routers/chat.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import ChatRequest, ChatResponse
from app.services.chat_service import process_chat

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts: { message: str, session_id: str | None, history: list[Message] }
    Returns: { reply: str, products: list[Product], intent: ExtractedIntent, session_id: str }

    Flow:
    1. Load or create Session in DB
    2. Save user message to Conversation table
    3. Call Stage 1 (Intent Extraction) with full history
    4. If needs_clarification && clarifying_question → return question, skip product fetch
    5. If intent.confidence > 0.6 → call Edible /api/search/ with intent.keywords (parallel if multiple)
    6. Call Stage 2 (Product Curation) with intent + products
    7. Save assistant reply to Conversation table
    8. Save IntentLog to DB
    9. Return { reply, products, intent }
    """
    return await process_chat(db, request)
```

### `POST /api/search` (proxy)

```python
# app/routers/search.py

@router.post("/search", response_model=list[EdibleProduct])
async def search(request: SearchRequest):
    """
    Accepts: { keyword: str }
    Returns: Edible API response (pass-through, no transformation)
    Purpose: Keeps Edible API calls server-side, enables caching later
    """
    return await fetch_edible_products(request.keyword)
```

### `POST /api/analytics/click`

```python
# app/routers/analytics.py

@router.post("/analytics/click")
async def track_click(request: ClickRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts: { session_id: str, sku: str, name: str, position: int }
    Writes to ProductClick table
    Returns: 200 OK
    """
    await save_product_click(db, request)
    return {"status": "ok"}
```

### `POST /api/analytics/convert`

```python
# app/routers/analytics.py

@router.post("/analytics/convert")
async def mark_converted(request: ConvertRequest, db: AsyncSession = Depends(get_db)):
    """
    Accepts: { session_id: str }
    Sets Session.converted = True
    Returns: 200 OK
    """
    await mark_session_converted(db, request.session_id)
    return {"status": "ok"}
```

---

## Frontend Components (Next.js)

The frontend calls the Python FastAPI backend at `http://localhost:8000/api/*`.

```
frontend/
├── app/
│   ├── page.tsx                    # Main page — renders GiftConcierge
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── GiftConcierge.tsx        # Root component, manages state
│   ├── OccasionQuickStart.tsx   # 5 buttons: Birthday, Sympathy, Anniversary, Corporate, Surprise Me
│   ├── ChatWindow.tsx           # Scrollable message list
│   ├── ChatMessage.tsx          # Single message bubble (user or assistant)
│   ├── ChatInput.tsx            # Text input + send button
│   ├── ProductGrid.tsx          # 3-5 product cards, shown after recommendation
│   ├── ProductCard.tsx          # Image, name, price, tags (vegan/fresh/etc), CTA button
│   └── TypingIndicator.tsx      # Animated dots while AI is thinking
├── lib/
│   └── api.ts                   # Fetch wrapper for backend calls
├── types/
│   └── index.ts                 # TypeScript types matching Pydantic schemas
└── package.json
```

### Key UX Behaviors

**OccasionQuickStart:** Five buttons at the start of a fresh session. Clicking one pre-populates a message like "I'm looking for a birthday gift" — skips the blank-slate problem entirely.

**ProductCard tags:** Render dietary/attribute tags (Vegan, Sugar-Free, Bestseller, Same-Day) directly from the API-returned product metadata. The LLM does not generate these — they come from the raw data. This is the "confident purchase decision" layer.

**AI step-back:** After products are shown, the assistant message ends with a passive offer to help. No follow-up questions are sent unless the customer types again. No auto-suggestions, no pop-ups.

**Conversion tracking:** When a customer clicks a product card CTA ("View Product"), fire `POST /api/analytics/click` and `POST /api/analytics/convert` so the DB captures it.

---

## Python Dependencies

```txt
# backend/requirements.txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
sqlalchemy[asyncio]>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.0
anthropic>=0.18.0
httpx>=0.26.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-dotenv>=1.0.0
nanoid>=2.0.0
```

---

## Environment Variables

```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/edible_poc
EDIBLE_API_URL=https://www.ediblearrangements.com/api/search/

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Development Setup Commands

```bash
# 1. Start local Postgres via Docker
docker run --name edible-poc-db -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=user -e POSTGRES_DB=edible_poc -p 5432:5432 -d postgres:15

# 2. Setup Python backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Run database migrations
alembic upgrade head

# 4. Start backend server
uvicorn app.main:app --reload --port 8000

# 5. Setup & run frontend (separate terminal)
cd frontend
npm install
npm run dev
```

---

## File Structure

```
edible-gift-concierge/
├── backend/                         # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Settings from env vars
│   │   ├── database.py              # Async SQLAlchemy engine + session
│   │   ├── models.py                # SQLAlchemy ORM models
│   │   ├── schemas.py               # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── chat.py              # POST /api/chat
│   │   │   ├── search.py            # POST /api/search
│   │   │   └── analytics.py         # POST /api/analytics/*
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── chat_service.py      # Main chat orchestration
│   │   │   ├── intent_service.py    # Stage 1: intent extraction
│   │   │   ├── curation_service.py  # Stage 2: product curation
│   │   │   └── edible_client.py     # Edible API wrapper
│   │   └── prompts/
│   │       ├── __init__.py
│   │       ├── intent_extractor.py
│   │       └── product_curator.py
│   ├── alembic/                     # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env
│
├── frontend/                        # Next.js frontend
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── GiftConcierge.tsx
│   │   ├── OccasionQuickStart.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductCard.tsx
│   │   └── TypingIndicator.tsx
│   ├── lib/
│   │   └── api.ts                   # Backend API client
│   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── .env.local
│
└── README.md
```

---

## Pydantic Schemas (Backend)

```python
# app/schemas.py

from pydantic import BaseModel
from enum import Enum

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

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    history: list[Message] = []

class ChatResponse(BaseModel):
    reply: str
    products: list[EdibleProduct] = []
    intent: ExtractedIntent
    session_id: str

class SearchRequest(BaseModel):
    keyword: str

class ClickRequest(BaseModel):
    session_id: str
    sku: str
    name: str
    position: int

class ConvertRequest(BaseModel):
    session_id: str
```

## TypeScript Types (Frontend)

```typescript
// frontend/types/index.ts

export type Occasion = 'birthday' | 'sympathy' | 'anniversary' | 'corporate' | 'thank_you' | 'other';
export type Urgency = 'today' | 'this_week' | 'flexible';
export type Budget = 'low' | 'mid' | 'high';

export interface ExtractedIntent {
  occasion: Occasion | null;
  urgency: Urgency | null;
  recipient: string | null;
  budget: Budget | null;
  dietary: string[];
  keywords: string[];
  needs_clarification: boolean;
  clarifying_question: string | null;
  confidence: number;
}

export interface EdibleProduct {
  sku: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  tags: string[];
  pdp_url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  products: EdibleProduct[];
  intent: ExtractedIntent;
  session_id: string;
}
```

---

## Out of Scope for POC

- User authentication / accounts
- Cart integration (product CTA links to Edible PDP in new tab)
- Mobile-specific optimization
- Multi-language support
- Real-time streaming responses (standard request/response for now)
- Admin dashboard for analytics (data is in DB, queryable via Prisma Studio)

---

## Success Criteria for POC

| Metric | Target |
|--------|--------|
| End-to-end response latency | < 1.5 seconds |
| Intent extraction accuracy (manual review of 20 test cases) | > 85% |
| No hallucinated product claims | 0 tolerance |
| Sessions with product card shown | > 70% of sessions |
| Sessions where product was clicked | Baseline measurement only |
