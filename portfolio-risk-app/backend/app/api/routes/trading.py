"""
Trading API Routes

Endpoints for Alpaca paper trading operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.assessment import Portfolio
from app.api.routes.auth import get_current_active_user
from app.services.alpaca_trader import AlpacaTrader

router = APIRouter()


# Request/Response Models
class ExecutePortfolioRequest(BaseModel):
    investment_amount: float = Field(..., gt=0, description="Total dollar amount to invest")
    portfolio_id: Optional[int] = Field(None, description="Portfolio ID to execute (uses active if not specified)")


class PlaceOrderRequest(BaseModel):
    symbol: str = Field(..., description="Stock/ETF symbol")
    qty: Optional[float] = Field(None, gt=0, description="Number of shares")
    notional: Optional[float] = Field(None, gt=0, description="Dollar amount")
    side: str = Field("buy", description="Order side: buy or sell")


class AccountResponse(BaseModel):
    configured: bool
    account: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PositionsResponse(BaseModel):
    positions: List[Dict[str, Any]]
    total_value: float
    total_pl: float
    total_pl_percent: float


class OrdersResponse(BaseModel):
    orders: List[Dict[str, Any]]


class ExecutePortfolioResponse(BaseModel):
    success: bool
    total_investment: float
    orders: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    summary: Dict[str, int]


@router.get("/status")
async def get_trading_status(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Check if Alpaca trading is configured and get account status
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        return {
            "configured": False,
            "message": "Alpaca API keys not configured. Please add ALPACA_API_KEY and ALPACA_SECRET_KEY to your .env file.",
            "paper_trading": settings.ALPACA_PAPER_TRADING,
        }

    try:
        account = trader.get_account()
        return {
            "configured": True,
            "paper_trading": settings.ALPACA_PAPER_TRADING,
            "account_status": account.get("status"),
            "buying_power": account.get("buying_power"),
            "portfolio_value": account.get("portfolio_value"),
            "cash": account.get("cash"),
        }
    except Exception as e:
        return {
            "configured": True,
            "error": str(e),
            "message": "Error connecting to Alpaca. Check your API keys.",
        }


@router.get("/account", response_model=AccountResponse)
async def get_account(
    current_user: User = Depends(get_current_active_user)
) -> AccountResponse:
    """
    Get Alpaca account information
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        return AccountResponse(
            configured=False,
            error="Alpaca API keys not configured"
        )

    try:
        account = trader.get_account()
        return AccountResponse(
            configured=True,
            account=account
        )
    except Exception as e:
        return AccountResponse(
            configured=True,
            error=str(e)
        )


@router.get("/positions", response_model=PositionsResponse)
async def get_positions(
    current_user: User = Depends(get_current_active_user)
) -> PositionsResponse:
    """
    Get all current positions
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    try:
        positions = trader.get_positions()

        # Calculate totals
        total_value = sum(pos.get("market_value", 0) for pos in positions)
        total_pl = sum(pos.get("unrealized_pl", 0) for pos in positions)
        total_cost = sum(pos.get("cost_basis", 0) for pos in positions)
        total_pl_percent = (total_pl / total_cost * 100) if total_cost > 0 else 0

        return PositionsResponse(
            positions=positions,
            total_value=total_value,
            total_pl=total_pl,
            total_pl_percent=total_pl_percent
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/orders", response_model=OrdersResponse)
async def get_orders(
    status_filter: str = "all",
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
) -> OrdersResponse:
    """
    Get order history
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    try:
        orders = trader.get_orders(status=status_filter, limit=limit)
        return OrdersResponse(orders=orders)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/quotes/{symbol}")
async def get_quote(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get latest quote for a symbol
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    quote = trader.get_latest_quote(symbol.upper())

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No quote found for {symbol}"
        )

    return quote


@router.post("/quotes/batch")
async def get_quotes_batch(
    symbols: List[str],
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get latest quotes for multiple symbols
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    symbols_upper = [s.upper() for s in symbols]
    quotes = trader.get_latest_quotes(symbols_upper)

    return {"quotes": quotes}


@router.post("/order")
async def place_order(
    request: PlaceOrderRequest,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Place a single market order
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    if request.qty is None and request.notional is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either qty or notional must be provided"
        )

    try:
        order = trader.place_market_order(
            symbol=request.symbol.upper(),
            qty=request.qty,
            notional=request.notional,
            side=request.side
        )

        if order:
            return {"success": True, "order": order}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to place order"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/execute-portfolio", response_model=ExecutePortfolioResponse)
async def execute_portfolio(
    request: ExecutePortfolioRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> ExecutePortfolioResponse:
    """
    Execute the entire portfolio - buy all ETFs according to allocations
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured. Please add your Alpaca API keys to the .env file."
        )

    # Get the portfolio
    if request.portfolio_id:
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == request.portfolio_id,
            Portfolio.user_id == current_user.id
        ).first()
    else:
        portfolio = db.query(Portfolio).filter(
            Portfolio.user_id == current_user.id,
            Portfolio.is_active == True
        ).first()

    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No portfolio found. Please generate a portfolio first."
        )

    # Get allocations from portfolio
    allocations = portfolio.allocations

    if not allocations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portfolio has no allocations"
        )

    # Check account buying power
    try:
        account = trader.get_account()
        buying_power = account.get("buying_power", 0)

        if request.investment_amount > buying_power:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient buying power. Available: ${buying_power:.2f}, Requested: ${request.investment_amount:.2f}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking account: {str(e)}"
        )

    # Execute the portfolio
    try:
        result = trader.execute_portfolio(
            allocations=allocations,
            total_investment=request.investment_amount
        )

        return ExecutePortfolioResponse(
            success=result["success"],
            total_investment=result["total_investment"],
            orders=result["orders"],
            errors=result["errors"],
            summary=result["summary"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/order/{order_id}")
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Cancel an open order
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    success = trader.cancel_order(order_id)

    if success:
        return {"success": True, "message": f"Order {order_id} cancelled"}
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel order"
        )


@router.delete("/orders")
async def cancel_all_orders(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Cancel all open orders
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    result = trader.cancel_all_orders()
    return result


@router.delete("/position/{symbol}")
async def close_position(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Close a specific position
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    try:
        order = trader.close_position(symbol.upper())

        if order:
            return {"success": True, "order": order}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to close position"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/positions")
async def close_all_positions(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Close all positions (liquidate entire portfolio)
    """
    trader = AlpacaTrader()

    if not trader.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Alpaca API keys not configured"
        )

    result = trader.close_all_positions()
    return result
