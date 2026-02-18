from logging.config import fileConfig
import os

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import make_url

from alembic import context

from app.base import Base
from app.models import Session, Conversation, IntentLog, ProductClick  # noqa: F401
from app.config import get_settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    raw_url = os.getenv("DATABASE_URL") or get_settings().database_url
    url = make_url(raw_url)
    if url.drivername == "sqlite+aiosqlite":
        url = url.set(drivername="sqlite")
    return str(url)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = make_url(get_url())
    connect_args = {"check_same_thread": False} if url.get_backend_name() == "sqlite" else {}
    connectable = create_engine(
        str(url),
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
