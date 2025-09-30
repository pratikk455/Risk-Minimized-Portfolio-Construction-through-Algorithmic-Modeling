from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api.routes import auth, assessment, portfolio, users
from app.api.v1.api import api_router as api_v1_router
from app.core.database import engine, Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Application shutdown")

app = FastAPI(
    title="Portfolio Risk Management API",
    description="API for risk assessment and portfolio construction",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Portfolio Risk Management API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# V1 API with enhanced authentication (2FA, multi-step registration)
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Legacy API routes (for backward compatibility)
app.include_router(auth.router, prefix="/api/auth", tags=["authentication-legacy"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["assessment"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])