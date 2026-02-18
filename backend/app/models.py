import json
from datetime import datetime
from typing import Any
from sqlalchemy import String, Boolean, Float, Integer, ForeignKey, Text, TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column, relationship
from nanoid import generate

from app.base import Base


def generate_id() -> str:
    return generate(size=21)


class JSONList(TypeDecorator):
    """Store list as JSON string for SQLite compatibility."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: list | None, dialect: Any) -> str | None:
        if value is None:
            return "[]"
        return json.dumps(value)

    def process_result_value(self, value: str | None, dialect: Any) -> list:
        if value is None:
            return []
        return json.loads(value)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    converted: Mapped[bool] = mapped_column(Boolean, default=False)

    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    intent_logs: Mapped[list["IntentLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    product_clicks: Mapped[list["ProductClick"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(10))  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="conversations")


class IntentLog(Base):
    __tablename__ = "intent_logs"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    occasion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    urgency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    recipient: Mapped[str | None] = mapped_column(String(100), nullable=True)
    budget: Mapped[str | None] = mapped_column(String(10), nullable=True)
    dietary: Mapped[list[str]] = mapped_column(JSONList, default=list)
    keywords: Mapped[list[str]] = mapped_column(JSONList, default=list)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="intent_logs")


class ProductClick(Base):
    __tablename__ = "product_clicks"

    id: Mapped[str] = mapped_column(String(21), primary_key=True, default=generate_id)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    sku: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    position: Mapped[int] = mapped_column(Integer)  # 1-5 in recommendation list
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    session: Mapped["Session"] = relationship(back_populates="product_clicks")
