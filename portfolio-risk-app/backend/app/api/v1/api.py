from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

# Include authentication endpoints with enhanced multi-step registration and 2FA
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# Add other endpoint routers here as they are created
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
# api_router.include_router(risk.router, prefix="/risk", tags=["risk"])