import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def get_database_url():
    """Build database URL, supporting Cloud SQL Unix socket connection."""
    # Check for Cloud SQL connection
    cloud_sql_connection = os.environ.get("CLOUD_SQL_CONNECTION_NAME")
    if cloud_sql_connection:
        # Cloud SQL via Unix socket
        db_user = os.environ.get("DB_USER", "appuser")
        db_pass = os.environ.get("DB_PASS", "AppPass123")
        db_name = os.environ.get("DB_NAME", "portfolio")
        socket_path = f"/cloudsql/{cloud_sql_connection}"
        return f"postgresql+psycopg2://{db_user}:{db_pass}@/{db_name}?host={socket_path}"

    # Fallback to DATABASE_URL or default SQLite
    return settings.DATABASE_URL

database_url = get_database_url()

# Handle SQLite connection args
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
