"""Initial schema - sessions, conversations, intent_logs, product_clicks

Revision ID: 001
Revises:
Create Date: 2025-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Sessions table
    op.create_table(
        "sessions",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("converted", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )

    # Conversations table
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("session_id", sa.String(21), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_conversations_session_id", "conversations", ["session_id"])

    # Intent logs table
    op.create_table(
        "intent_logs",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("session_id", sa.String(21), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("occasion", sa.String(50), nullable=True),
        sa.Column("urgency", sa.String(20), nullable=True),
        sa.Column("recipient", sa.String(100), nullable=True),
        sa.Column("budget", sa.String(10), nullable=True),
        sa.Column("dietary", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("keywords", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_intent_logs_session_id", "intent_logs", ["session_id"])

    # Product clicks table
    op.create_table(
        "product_clicks",
        sa.Column("id", sa.String(21), primary_key=True),
        sa.Column("session_id", sa.String(21), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("sku", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_product_clicks_session_id", "product_clicks", ["session_id"])


def downgrade() -> None:
    op.drop_table("product_clicks")
    op.drop_table("intent_logs")
    op.drop_table("conversations")
    op.drop_table("sessions")
