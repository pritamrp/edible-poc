from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings
from app.base import Base  # noqa: F401 - re-export for convenience

settings = get_settings()

# Use sync SQLite - built into Python, no extra deps
DATABASE_URL = "sqlite:///./edible_poc.db"

engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args={"check_same_thread": False},  # Needed for FastAPI
)

# Enable foreign key support for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for FastAPI routes to get a database session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
