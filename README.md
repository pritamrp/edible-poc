# Edible Arrangements — AI Gift Concierge

AI-powered gift discovery experience that helps customers find the perfect gift through a guided 4-step wizard with conversational AI.

![Status](https://img.shields.io/badge/Status-Ready%20for%20Testing-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o-412991)

---

## Quick Start

### First-time setup (run once)

#### Backend
```powershell
# from the repo root
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt

cd backend
Copy-Item .env.example .env
# edit backend\.env and set OPENAI_API_KEY
alembic upgrade head
```

#### Frontend
```powershell
cd frontend
npm install
```

### Daily run

#### One-command dev run (Windows PowerShell)
```powershell
.\run_dev.ps1
```

#### Backend
```powershell
# from the repo root
.\.venv\Scripts\Activate
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```powershell
cd frontend
npm run dev
```

### Open app
Frontend: http://localhost:3000  
API Docs: http://localhost:8000/docs

Note: Re-run `alembic upgrade head` if you delete `backend/edible_poc.db` or pull new migrations.

---

## Deploy on Render

`run_dev.ps1` is for local Windows development. On Render, run the backend and frontend as two services.

Backend service (FastAPI):
- Build command: `pip install -r requirements.txt`
- Start command: `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env vars: `OPENAI_API_KEY` (required), `CORS_ORIGINS` (set to your frontend URL), optional `DATABASE_URL`

Frontend service (Next.js):
- Build command: `cd frontend && npm ci && npm run build`
- Start command: `cd frontend && npx next start -p $PORT`
- Env var: `NEXT_PUBLIC_API_URL` = `https://<your-backend>.onrender.com/api`

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Next.js 14 Frontend (port 3000)            │   │
│   │                                                         │   │
│   │   ┌──────────────────────────────────────────────────┐  │   │
│   │   │              4-Step Gift Wizard                  │  │   │
│   │   │  [Occasion] → [Recipient] → [Prompt] → [Products]│  │   │
│   │   └──────────────────────────────────────────────────┘  │   │
│   │                          │                              │   │
│   │   ┌──────────────────────▼──────────────────────────┐   │   │
│   │   │    GiftConcierge (State Orchestrator)           │   │   │
│   │   └──────────────────────┬──────────────────────────┘   │   │
│   │                          │                              │   │
│   │   ┌──────────────────────▼──────────────────────────┐   │   │
│   │   │         lib/api.ts (HTTP Client)                │   │   │
│   │   └──────────────────────┬──────────────────────────┘   │   │
│   └──────────────────────────│──────────────────────────────┘   │
│                              │                                  │
└──────────────────────────────│──────────────────────────────────┘
                               │ HTTP/JSON
┌──────────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend (port 8000)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│   │  POST /api/chat  │  │ POST /api/search│ │POST /analytics │  │
│   └────────┬─────────┘  └───────┬────────┘  └───────┬────────┘  │
│            │                    │                   │           │
│   ┌────────▼─────────────────────────────────────────────────┐  │
│   │                     Services Layer                       │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│   │  │   Intent    │  │  Curation   │  │  Edible Client  │   │  │
│   │  │  Service    │  │  Service    │  │  (API Proxy)    │   │  │
│   │  │  (GPT-4o)   │  │(GPT-4o-mini)│  │                 │   │  │
│   │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │  │
│   └─────────│────────────────│──────────────────│────────────┘  │
│             │                │                  │               │
└─────────────│────────────────│──────────────────│───────────────┘
              │                │                  │
    ┌─────────▼────────────────▼───┐    ┌────────▼────────────┐
    │        OpenAI API            │    │   Edible Search API │
    │   GPT-4o / GPT-4o-mini       │    │ ediblearrangements  │
    └──────────────────────────────┘    └─────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   SQLite Database   │
         │   edible_poc.db     │
         │  ┌───────────────┐  │
         │  │   sessions    │  │
         │  │ conversations │  │
         │  │  intent_logs  │  │
         │  │product_clicks │  │
         │  └───────────────┘  │
         └─────────────────────┘
```

---

## User Journey (4-Step Wizard)

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: OCCASION                                           │
│  "What's the occasion?"                                     │
│  [Birthday] [Anniversary] [Thank You] [Corporate] [Other]   │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: RECIPIENT                                          │
│  "Who is it for?"                                           │
│  Personal: [Spouse] [Parents] [Siblings] [Friends]          │
│  Corporate: [Colleague] [Client] [Boss] [Team]              │
│  [Someone else...] → Custom text input                      │
│                                                             │
│  💡 Or describe what you need:                              │
│  "Anniversary gift for wife under $50"                      │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: PROMPT PREVIEW                                     │
│  Suggested: "Anniversary gifts for spouse"                  │
│  [Use this] or [Type your own: _______________]             │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: PRODUCTS + FEEDBACK                                │
│  "Anything that catches your eye?"                          │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Product │ │ Product │ │ Product │                       │
│  │  Card   │ │  Card   │ │  Card   │                       │
│  │ 👍  👎  │ │ 👍  👎  │ │ 👍  👎  │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
│  👍 → Expand inline details + "View on Site"                │
│  👎 (all) → "What's wrong?" [Too expensive] [Not style]...  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Backend | Python 3.11+, FastAPI |
| Database | SQLite, SQLAlchemy 2.0, Alembic |
| AI | OpenAI GPT-4o (intent), GPT-4o-mini (curation) |
| HTTP | httpx (backend), fetch (frontend) |

---

## Project Structure

```
Edible/
├── .venv/                      # Python virtual environment
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── CLAUDE.md                   # Detailed build documentation
│
├── docs/                       # System design diagrams
│   ├── system-design.html      # Interactive Mermaid diagrams
│   ├── system-design.mmd       # Mermaid source
│   └── system-design.puml      # PlantUML source
│
├── backend/
│   ├── .env                    # Environment variables
│   ├── alembic.ini             # Migration config
│   ├── edible_poc.db           # SQLite database
│   ├── alembic/
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── app/
│       ├── main.py             # FastAPI entry point
│       ├── config.py           # Settings
│       ├── database.py         # SQLite connection
│       ├── models.py           # ORM models
│       ├── schemas.py          # Pydantic schemas
│       ├── routers/
│       │   ├── chat.py         # POST /api/chat
│       │   ├── search.py       # POST /api/search
│       │   └── analytics.py    # POST /api/analytics/*
│       ├── services/
│       │   ├── intent_service.py    # GPT-4o intent extraction
│       │   ├── curation_service.py  # GPT-4o-mini curation
│       │   └── edible_client.py     # Edible API client
│       └── prompts/
│           ├── intent_extractor.py
│           └── product_curator.py
│
└── frontend/
    ├── .env.local              # NEXT_PUBLIC_API_URL
    ├── package.json
    ├── tailwind.config.ts
    ├── next.config.js
    ├── app/
    │   ├── globals.css         # Edible brand styles
    │   ├── layout.tsx          # Root layout
    │   └── page.tsx            # Main page
    ├── components/
    │   ├── GiftConcierge.tsx   # Main wizard orchestrator
    │   ├── StepIndicator.tsx   # Progress indicator (1-2-3-4)
    │   ├── OccasionQuickStart.tsx  # Step 1: Occasion
    │   ├── RecipientStep.tsx   # Step 2: Recipient (context-aware)
    │   ├── PromptStep.tsx      # Step 3: Prompt preview
    │   ├── ProductGrid.tsx     # Step 4: Products
    │   ├── ProductCard.tsx     # With thumbs up/down
    │   ├── ProductDetails.tsx  # Expanded modal view
    │   └── FeedbackOptions.tsx # Refinement options
    ├── lib/
    │   └── api.ts              # Backend API client
    └── types/
        └── index.ts            # TypeScript types
```

---

## Design System

**Brand Colors** (Official Edible Arrangements):
| Name | Hex | Usage |
|------|-----|-------|
| Edible Red | `#E10700` | Primary actions, accents |
| Red Dark | `#C20600` | Hover states |
| Red Light | `#FF1A0D` | Highlights |
| White | `#FFFFFF` | Backgrounds |
| Neutral 900 | `#171717` | Text |

**Typography**:
- Font Family: **Poppins** (Google Fonts)
- Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Components**:
- Buttons: Red gradient with white text, subtle shadows
- Cards: White with soft shadows, rounded corners
- Step indicator: Dots with red active state
- Product feedback: Thumbs up/down with animation

---

## Environment Variables

### Backend (`backend/.env`)
```env
OPENAI_API_KEY=sk-proj-your-key-here
DATABASE_URL=sqlite:///./edible_poc.db
EDIBLE_API_URL=https://www.ediblearrangements.com/api/search/
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/chat` | Main AI chat endpoint |
| POST | `/api/search` | Product search proxy |
| POST | `/api/analytics/click` | Track product clicks |
| POST | `/api/analytics/convert` | Mark session converted |

### Chat Request
```json
{
  "message": "Birthday gift for mom",
  "session_id": null,
  "history": []
}
```

### Chat Response
```json
{
  "reply": "I'd love to help you find something special...",
  "products": [
    {
      "sku": "6108-6ct",
      "name": "Happy Birthday Box",
      "price": 56.99,
      "image_url": "https://...",
      "pdp_url": "https://www.ediblearrangements.com/...",
      "tags": ["Birthday"]
    }
  ],
  "intent": {
    "occasion": "birthday",
    "recipient": "mom",
    "confidence": 0.85
  },
  "session_id": "abc123..."
}
```

---

## AI Pipeline

```
User Message / Wizard Input
           │
           ▼
┌─────────────────────────────────┐
│  Stage 1: Intent Extraction     │
│  Model: GPT-4o                  │
│  Output: Structured JSON        │
│  - occasion, recipient          │
│  - budget, urgency              │
│  - dietary requirements         │
│  - search keywords              │
└──────────────┬──────────────────┘
               │
               ▼
        Edible API Search
        (50 products)
               │
               ▼
┌─────────────────────────────────┐
│  Stage 2: Product Curation      │
│  Model: GPT-4o-mini             │
│  Output: Top 3-5 picks          │
│  + Conversational reply         │
└─────────────────────────────────┘
```

---

## Database Schema

```sql
-- Session tracking
sessions (id, created_at, updated_at, converted)

-- Message history
conversations (id, session_id, role, content, created_at)

-- Intent extraction logs
intent_logs (id, session_id, occasion, urgency, recipient,
             budget, dietary, keywords, confidence, created_at)

-- Click analytics
product_clicks (id, session_id, sku, name, position, created_at)
```

---

## Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Test Chat API
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "birthday gift for mom", "session_id": null, "history": []}'
```

### Test Search API
```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword": "birthday"}'
```

---

## System Design Exports

Interactive diagrams available in `/docs/`:
- **`system-design.html`** — Open in browser for interactive Mermaid diagrams
- **`system-design.mmd`** — Import into Mermaid Live Editor
- **`system-design.puml`** — Import into PlantUML

---

## Success Metrics

| Metric | Target |
|--------|--------|
| End-to-end response latency | < 1.5 seconds |
| Intent extraction accuracy | > 85% |
| No hallucinated product claims | 0 tolerance |
| Sessions with products shown | > 70% |

---

## License

Internal POC — Not for distribution.
