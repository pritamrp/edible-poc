from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat, search, analytics

settings = get_settings()

raw_origins = (settings.cors_origins or "").strip()
if raw_origins == "*":
    cors_allow_origins = ["*"]
    cors_allow_credentials = False
else:
    cors_allow_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    if not cors_allow_origins:
        cors_allow_origins = ["http://localhost:3000"]
    cors_allow_credentials = True

app = FastAPI(
    title="Edible Gift Concierge API",
    description="AI-powered gift discovery for Edible Arrangements",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins,
    allow_credentials=cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(analytics.router, prefix="/api", tags=["analytics"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
