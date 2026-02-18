from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session

from app.config import get_settings
from app.base import Base  # noqa: F401 - re-export for convenience

settings = get_settings()

def _to_sync_database_url(raw_url: str) -> str:
    url = make_url(raw_url)
    if url.drivername == "sqlite+aiosqlite":
        url = url.set(drivername="sqlite")
    return str(url)

DATABASE_URL = _to_sync_database_url(settings.database_url)
_url = make_url(DATABASE_URL)
_is_sqlite = _url.get_backend_name() == "sqlite"

engine = create_engine(
    DATABASE_URL,
    echo=settings.sqlalchemy_echo,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

if _is_sqlite:
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
