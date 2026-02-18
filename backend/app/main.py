from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, search, analytics

app = FastAPI(
    title="Edible Gift Concierge API",
    description="AI-powered gift discovery for Edible Arrangements",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
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
