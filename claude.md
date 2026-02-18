# Edible Gift Concierge - Complete Build Documentation

## Project Status: READY FOR TESTING

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

## System Design Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER BROWSER                                      │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                         NEXT.JS 14 FRONTEND (localhost:3000)                   │ │
│  │                                                                                │ │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐        │ │
│  │  │   Step 1    │──▶│   Step 2    │──▶│   Step 3    │──▶│   Step 4    │        │ │
│  │  │  Occasion   │   │  Recipient  │   │   Prompt    │   │  Products   │        │ │
│  │  │ QuickStart  │   │    Step     │   │    Step     │   │    Grid     │        │ │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘        │ │
│  │         │                 │                 │                 │                │ │
│  │         └─────────────────┴─────────────────┴─────────────────┘                │ │
│  │                                     │                                          │ │
│  │                          ┌──────────▼──────────┐                               │ │
│  │                          │   GiftConcierge     │                               │ │
│  │                          │   (Orchestrator)    │                               │ │
│  │                          │   - Wizard State    │                               │ │
│  │                          │   - Session ID      │                               │ │
│  │                          │   - Products        │                               │ │
│  │                          │   - Feedback Map    │                               │ │
│  │                          └──────────┬──────────┘                               │ │
│  │                                     │                                          │ │
│  │                          ┌──────────▼──────────┐                               │ │
│  │                          │      lib/api.ts     │                               │ │
│  │                          │   - sendChatMessage │                               │ │
│  │                          │   - trackClick      │                               │ │
│  │                          │   - trackConversion │                               │ │
│  │                          └──────────┬──────────┘                               │ │
│  └─────────────────────────────────────┼──────────────────────────────────────────┘ │
└────────────────────────────────────────┼────────────────────────────────────────────┘
                                         │
                                         │ HTTP/REST (fetch)
                                         │
┌────────────────────────────────────────▼────────────────────────────────────────────┐
│                         FASTAPI BACKEND (localhost:8000)                            │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              ROUTERS                                           │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐             │ │
│  │  │  POST /api/chat  │  │ POST /api/search │  │ POST /api/       │             │ │
│  │  │                  │  │                  │  │ analytics/*      │             │ │
│  │  │  Main AI Chat    │  │  Product Search  │  │  Click/Convert   │             │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘             │ │
│  └───────────┼─────────────────────┼─────────────────────┼────────────────────────┘ │
│              │                     │                     │                          │
│  ┌───────────▼─────────────────────▼─────────────────────▼────────────────────────┐ │
│  │                              SERVICES                                          │ │
│  │                                                                                │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐    │ │
│  │  │   intent_service    │  │  curation_service   │  │   edible_client     │    │ │
│  │  │                     │  │                     │  │                     │    │ │
│  │  │  GPT-4o             │  │  GPT-4o-mini        │  │  Edible API Proxy   │    │ │
│  │  │  Extract intent:    │  │  Curate products:   │  │  Fetch products     │    │ │
│  │  │  - occasion         │  │  - Select 3-5 best  │  │  from catalog       │    │ │
│  │  │  - recipient        │  │  - Generate reply   │  │                     │    │ │
│  │  │  - budget           │  │  - No hallucination │  │                     │    │ │
│  │  │  - keywords         │  │                     │  │                     │    │ │
│  │  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘    │ │
│  └─────────────┼─────────────────────────┼─────────────────────────┼──────────────┘ │
│                │                         │                         │                │
└────────────────┼─────────────────────────┼─────────────────────────┼────────────────┘
                 │                         │                         │
        ┌────────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐
        │                 │       │                 │       │                 │
        │   OPENAI API    │       │   OPENAI API    │       │  EDIBLE SEARCH  │
        │                 │       │                 │       │      API        │
        │   gpt-4o        │       │   gpt-4o-mini   │       │                 │
        │   (Intent)      │       │   (Curation)    │       │  POST /api/     │
        │                 │       │                 │       │  search/        │
        └─────────────────┘       └─────────────────┘       │                 │
                                                            │  Returns 50     │
                                                            │  products       │
                                                            └─────────────────┘
                 │
                 │
┌────────────────▼────────────────────────────────────────────────────────────────────┐
│                              SQLITE DATABASE                                         │
│                              (edible_poc.db)                                         │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │    sessions     │  │  conversations  │  │   intent_logs   │  │ product_clicks  │ │
│  │                 │  │                 │  │                 │  │                 │ │
│  │  id (PK)        │  │  id (PK)        │  │  id (PK)        │  │  id (PK)        │ │
│  │  created_at     │  │  session_id(FK) │  │  session_id(FK) │  │  session_id(FK) │ │
│  │  updated_at     │  │  role           │  │  occasion       │  │  sku            │ │
│  │  converted      │  │  content        │  │  recipient      │  │  name           │ │
│  │                 │  │  created_at     │  │  budget         │  │  position       │ │
│  │                 │  │                 │  │  keywords       │  │  created_at     │ │
│  │                 │  │                 │  │  confidence     │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                         │
└──────────────────────────────────────────────────────────────────────────────────┘

User Input: "Birthday gift for mom under $50"
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  1. INTENT EXTRACTION (GPT-4o)                                                    │
│                                                                                   │
│     Input:  "Birthday gift for mom under $50"                                     │
│     Output: {                                                                     │
│               occasion: "birthday",                                               │
│               recipient: "mom",                                                   │
│               budget: "low",                                                      │
│               keywords: ["birthday", "mom", "affordable"],                        │
│               confidence: 0.92                                                    │
│             }                                                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  2. PRODUCT SEARCH (Edible API)                                                   │
│                                                                                   │
│     Request:  POST /api/search/ { keyword: "birthday" }                           │
│     Response: 50 products with: sku, name, price, image, tags, url                │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  3. PRODUCT CURATION (GPT-4o-mini)                                                │
│                                                                                   │
│     Input:  Intent + 50 Products                                                  │
│     Output: {                                                                     │
│               reply: "Here are some perfect birthday gifts for your mom...",      │
│               selected_skus: ["6108-6ct", "5234-lg", "7891-sm"],                  │
│               reasoning: "Selected affordable fruit arrangements..."              │
│             }                                                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  4. RESPONSE TO FRONTEND                                                          │
│                                                                                   │
│     {                                                                             │
│       reply: "Here are some perfect birthday gifts...",                           │
│       products: [{ sku, name, price, image_url, pdp_url, tags }],                 │
│       intent: { occasion, recipient, confidence },                                │
│       session_id: "abc123..."                                                     │
│     }                                                                             │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND COMPONENT TREE                                │
└─────────────────────────────────────────────────────────────────────────────────┘

page.tsx
    │
    └── GiftConcierge (Orchestrator)
            │
            ├── StepIndicator ─────────────────────── Progress dots (1-2-3-4)
            │
            ├── Step 1: OccasionQuickStart ────────── [Birthday] [Thank You] ...
            │
            ├── Step 2: RecipientStep ─────────────── [Spouse] [Parents] ...
            │       │                                  [Someone else] + custom input
            │       └── Natural Query Input ───────── "Anniversary gift for wife..."
            │
            ├── Step 3: PromptStep ────────────────── Suggested prompt + customize
            │
            ├── Step 4: ProductGrid ───────────────── Product results
            │       │
            │       └── ProductCard ×5 ────────────── Image, name, price, 👍👎
            │
            ├── FeedbackOptions ───────────────────── "Too expensive" "Not my style"
            │
            └── ProductDetails (Modal) ────────────── Expanded view on 👍
```

---

## File Structure

```
Edible/
├── .venv/                      # Python virtual environment
├── requirements.txt            # Python dependencies
├── README.md                   # Project documentation
├── CLAUDE_CODE_PLAN.md         # Original spec
├── claude.md                   # This file
│
├── docs/                       # Exportable diagrams
│   ├── system-design.html      # Interactive diagram (open in browser)
│   ├── system-design.mmd       # Mermaid source
│   └── system-design.puml      # PlantUML source
│
├── backend/
│   ├── .env                    # Environment variables
│   ├── alembic.ini             # Migration config
│   ├── edible_poc.db           # SQLite database
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI entry point
│       ├── config.py           # Settings
│       ├── database.py         # SQLite connection
│       ├── base.py             # SQLAlchemy Base
│       ├── models.py           # ORM models
│       ├── schemas.py          # Pydantic schemas
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── chat.py         # POST /api/chat
│       │   ├── search.py       # POST /api/search
│       │   └── analytics.py    # POST /api/analytics/*
│       ├── services/
│       │   ├── __init__.py
│       │   ├── intent_service.py    # GPT-4o intent extraction
│       │   ├── curation_service.py  # GPT-4o-mini curation
│       │   └── edible_client.py     # Edible API client
│       └── prompts/
│           ├── __init__.py
│           ├── intent_extractor.py
│           └── product_curator.py
│
└── frontend/
    ├── .env.local              # NEXT_PUBLIC_API_URL
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── next.config.js
    ├── postcss.config.js
    ├── app/
    │   ├── globals.css         # Custom styles, animations
    │   ├── layout.tsx          # Root layout
    │   └── page.tsx            # Main page
    ├── components/
    │   ├── index.ts
    │   ├── GiftConcierge.tsx   # Main wizard orchestrator
    │   ├── StepIndicator.tsx   # Progress indicator (1-2-3-4)
    │   ├── OccasionQuickStart.tsx  # Step 1: Occasion
    │   ├── RecipientStep.tsx   # Step 2: Recipient (context-aware)
    │   ├── PromptStep.tsx      # Step 3: Prompt preview
    │   ├── ProductGrid.tsx     # Step 4: Products
    │   ├── ProductCard.tsx     # With thumbs up/down
    │   ├── ProductDetails.tsx  # Expanded modal view
    │   ├── FeedbackOptions.tsx # Refinement options
    │   ├── ChatWindow.tsx      # (legacy)
    │   ├── ChatMessage.tsx     # (legacy)
    │   ├── ChatInput.tsx       # (legacy)
    │   └── TypingIndicator.tsx
    ├── lib/
    │   └── api.ts              # Backend API client
    └── types/
        └── index.ts            # TypeScript types
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| Backend | Python 3.11+, FastAPI (sync) |
| Database | SQLite |
| ORM | SQLAlchemy 2.0 |
| AI | OpenAI GPT-4o / GPT-4o-mini |
| HTTP | httpx (backend), fetch (frontend) |

---

## Design System (Edible Brand)

### Brand Colors
```css
--edible-red: #E10700;        /* Primary brand red */
--edible-red-dark: #C20600;   /* Hover state */
--edible-red-light: #FF1A0D;  /* Accent */
```

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Edible Red | `#E10700` | Primary buttons, accents, price |
| White | `#FFFFFF` | Backgrounds, cards |
| Neutral 50 | `#FAFAFA` | Light backgrounds |
| Neutral 200 | `#E5E5E5` | Borders |
| Neutral 500 | `#737373` | Secondary text |
| Neutral 900 | `#171717` | Primary text |

### Typography
- **Font Family**: Poppins (Google Fonts)
- **Display**: Poppins 600 (semibold)
- **Body**: Poppins 400 (regular)

### Animations
- `fade-up`: Entry animation
- `slide-in`: Horizontal entry
- `float`: Gentle bobbing
- `pulse-soft`: Subtle pulse

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
  "message": "I need a birthday gift for my mom",
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
      "image_url": "https://resources.ediblearrangements.com/...",
      "description": "...",
      "tags": ["Birthday", "Boxes of Chocolate Covered Fruit"],
      "pdp_url": "https://www.ediblearrangements.com/happy-birthday-box-6108"
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

## Edible API Integration

### Endpoint
```
POST https://www.ediblearrangements.com/api/search/
```

### Request
```json
{
  "keyword": "birthday"
}
```

### Headers Required
```
Content-Type: application/json
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...
```

### Response
Returns a JSON array of 50 product objects.

### Field Mapping

| Our Schema | Edible API Field |
|------------|------------------|
| `sku` | `catalogCode` |
| `name` | `name` |
| `price` | `minPrice` |
| `image_url` | `image` |
| `pdp_url` | `url` (prefixed with base URL) |
| `description` | `description` or `metaTagDescription` |
| `tags` | `occasion` + parsed `category` |

---

## AI Pipeline

### Stage 1: Intent Extraction (GPT-4o)

**Purpose**: Extract structured intent from user message

**Output Schema**:
```json
{
  "occasion": "birthday" | "sympathy" | "anniversary" | "corporate" | "thank_you" | "other" | null,
  "urgency": "today" | "this_week" | "flexible" | null,
  "recipient": "string or null",
  "budget": "low" | "mid" | "high" | null,
  "dietary": ["array of dietary requirements"],
  "keywords": ["search", "keywords"],
  "needs_clarification": false,
  "clarifying_question": null,
  "confidence": 0.85
}
```

### Stage 2: Product Curation (GPT-4o-mini)

**Purpose**: Select best 3-5 products and generate conversational response

**Rules**:
- Only reference products in provided catalog
- Only use attributes present in product data
- No claims about delivery timing
- No upselling or pressure
- End with: "Let me know if you'd like more details..."

---

## Database Schema

```
┌─────────────────┐       ┌─────────────────┐
│    sessions     │       │  conversations  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ created_at      │  │    │ session_id (FK) │──┐
│ updated_at      │  │    │ role            │  │
│ converted       │  │    │ content         │  │
└─────────────────┘  │    │ created_at      │  │
                     │    └─────────────────┘  │
                     │                         │
                     │    ┌─────────────────┐  │
                     │    │   intent_logs   │  │
                     │    ├─────────────────┤  │
                     └───▶│ id (PK)         │  │
                          │ session_id (FK) │◀─┘
                          │ occasion        │
                          │ recipient       │
                          │ budget          │
                          │ keywords        │
                          │ confidence      │
                          │ created_at      │
                          └─────────────────┘

                          ┌─────────────────┐
                          │ product_clicks  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ session_id (FK) │
                          │ sku             │
                          │ name            │
                          │ position        │
                          │ created_at      │
                          └─────────────────┘
```

---

## Frontend Components

### Components

| Component | Purpose |
|-----------|---------|
| `GiftConcierge` | Main wizard orchestrator, manages 4-step flow |
| `StepIndicator` | Visual progress dots (1-2-3-4) with red theme |
| `OccasionQuickStart` | Step 1: Occasion selection buttons |
| `RecipientStep` | Step 2: Context-aware recipients + natural query |
| `PromptStep` | Step 3: Suggested prompt + custom input |
| `ProductGrid` | Step 4: Responsive product grid with feedback |
| `ProductCard` | Product with thumbs up/down feedback buttons |
| `ProductDetails` | Expanded product modal (on thumbs up) |
| `FeedbackOptions` | "What's wrong?" options (after all thumbs down) |

### User Journey (4-Step Wizard)

```
Step 1: OCCASION
  "What's the occasion?"
  [Birthday] [Anniversary] [Thank You] [Corporate] [Surprise Me]
        ↓
Step 2: RECIPIENT
  "Who is it for?"
  Personal: [Spouse] [Parents] [Siblings] [Friends] [Someone else]
  Corporate: [Colleague] [Client] [Boss] [Team] [Someone else]

  ─── or describe what you need ───
  [Natural language input: "Anniversary gift for wife under $100"]
        ↓
Step 3: PROMPT PREVIEW
  Suggested: "Birthday gifts for parents"
  [Use this] or [Type your own: ___]
        ↓
Step 4: PRODUCTS + FEEDBACK
  "Anything that catches your eye?"
  [Product 👍👎] [Product 👍👎] [Product 👍👎]

  👍 → Opens detailed product modal
  👎 (all) → Shows refinement options
```

---

## Testing Commands

### Health Check
```powershell
curl http://localhost:8000/health
```

### Test Chat API
```powershell
curl -X POST http://localhost:8000/api/chat `
  -H "Content-Type: application/json" `
  -d '{"message": "birthday gift for mom", "session_id": null, "history": []}'
```

### Test Search API
```powershell
curl -X POST http://localhost:8000/api/search `
  -H "Content-Type: application/json" `
  -d '{"keyword": "birthday"}'
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'app'"
→ Make sure you're in the `backend/` directory when running uvicorn

### "OPENAI_API_KEY not set"
→ Check `backend/.env` has your OpenAI key

### Frontend can't connect to backend
→ Make sure backend is running on port 8000
→ Check CORS is configured for localhost:3000

### Edible API returns empty
→ Check User-Agent header is set
→ Try different keywords

### Database errors
→ Run `alembic upgrade head` from backend/

---

## Export Diagrams

Exportable diagram files are available in `docs/`:

| File | Format | How to Export |
|------|--------|---------------|
| `system-design.html` | HTML/Mermaid | Open in browser → Print → Save as PDF |
| `system-design.mmd` | Mermaid | Use mermaid.live or VS Code extension |
| `system-design.puml` | PlantUML | Use plantuml.com or VS Code extension |

```powershell
# Open interactive diagram in browser
start C:\Users\prita\Desktop\Edible\docs\system-design.html
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| End-to-end response latency | < 1.5 seconds |
| Intent extraction accuracy | > 85% |
| No hallucinated product claims | 0 tolerance |
| Sessions with products shown | > 70% |

---

## Key Decisions Made

1. **OpenAI over Anthropic** - User preference for available API key
2. **SQLite over PostgreSQL** - Simpler setup, no Docker needed
3. **Sync over Async** - Avoided aiosqlite issues on Windows
4. **Separated frontend/backend** - Clean monorepo structure
5. **catalogCode as SKU** - Edible API uses this as primary identifier
6. **4-Step Wizard UX** - Guided flow: Occasion → Recipient → Prompt → Products
7. **Edible Brand Colors** - Red (#E10700), White, Black with Poppins font
8. **Context-aware Recipients** - Personal vs Corporate occasion options
9. **Natural Language Query** - Skip wizard with direct search

---

## Future Enhancements

- [ ] Add streaming responses for faster perceived latency
- [ ] Add product filtering (price, dietary)
- [ ] Mobile-responsive optimizations
- [ ] Add analytics dashboard
- [ ] Implement cart integration

---

*Last updated: Edible brand redesign + system diagrams added*
