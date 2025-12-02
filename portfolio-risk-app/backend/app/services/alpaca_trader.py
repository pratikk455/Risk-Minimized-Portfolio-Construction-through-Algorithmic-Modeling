"""
Alpaca Paper Trading Service

This service handles paper trading operations through Alpaca's API.
It allows users to execute their portfolio allocations with virtual money.
"""

from typing import Dict, List, Optional, Any
from decimal import Decimal
import logging

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import MarketOrderRequest, GetOrdersRequest
from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus, QueryOrderStatus
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockLatestQuoteRequest

from app.core.config import settings

logger = logging.getLogger(__name__)


class AlpacaTrader:
    """
    Alpaca Paper Trading Service

    Handles all trading operations including:
    - Getting account info
    - Placing orders
    - Getting positions
    - Getting order history
    """

    def __init__(self, api_key: str = None, secret_key: str = None, paper: bool = True):
        self.api_key = api_key or settings.ALPACA_API_KEY
        self.secret_key = secret_key or settings.ALPACA_SECRET_KEY
        self.paper = paper if paper is not None else settings.ALPACA_PAPER_TRADING

        if not self.api_key or not self.secret_key:
            logger.warning("Alpaca API keys not configured")
            self.trading_client = None
            self.data_client = None
        else:
            # Initialize trading client
            self.trading_client = TradingClient(
                api_key=self.api_key,
                secret_key=self.secret_key,
                paper=self.paper
            )

            # Initialize data client for quotes
            self.data_client = StockHistoricalDataClient(
                api_key=self.api_key,
                secret_key=self.secret_key
            )

    def is_configured(self) -> bool:
        """Check if Alpaca is properly configured"""
        return self.trading_client is not None

    def get_account(self) -> Optional[Dict[str, Any]]:
        """Get account information including buying power and portfolio value"""
        if not self.is_configured():
            return None

        try:
            account = self.trading_client.get_account()
            return {
                "account_number": account.account_number,
                "status": account.status.value if hasattr(account.status, 'value') else str(account.status),
                "currency": account.currency,
                "buying_power": float(account.buying_power),
                "cash": float(account.cash),
                "portfolio_value": float(account.portfolio_value),
                "equity": float(account.equity),
                "last_equity": float(account.last_equity),
                "long_market_value": float(account.long_market_value),
                "short_market_value": float(account.short_market_value),
                "initial_margin": float(account.initial_margin),
                "maintenance_margin": float(account.maintenance_margin),
                "daytrade_count": account.daytrade_count,
                "pattern_day_trader": account.pattern_day_trader,
                "trading_blocked": account.trading_blocked,
                "transfers_blocked": account.transfers_blocked,
                "account_blocked": account.account_blocked,
            }
        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            raise

    def get_positions(self) -> List[Dict[str, Any]]:
        """Get all current positions"""
        if not self.is_configured():
            return []

        try:
            positions = self.trading_client.get_all_positions()
            return [
                {
                    "symbol": pos.symbol,
                    "qty": float(pos.qty),
                    "avg_entry_price": float(pos.avg_entry_price),
                    "market_value": float(pos.market_value),
                    "cost_basis": float(pos.cost_basis),
                    "unrealized_pl": float(pos.unrealized_pl),
                    "unrealized_plpc": float(pos.unrealized_plpc) * 100,  # Convert to percentage
                    "current_price": float(pos.current_price),
                    "lastday_price": float(pos.lastday_price),
                    "change_today": float(pos.change_today) * 100,  # Convert to percentage
                    "side": pos.side.value if hasattr(pos.side, 'value') else str(pos.side),
                }
                for pos in positions
            ]
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            raise

    def get_latest_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get the latest quote for a symbol"""
        if not self.is_configured():
            return None

        try:
            request = StockLatestQuoteRequest(symbol_or_symbols=symbol)
            quotes = self.data_client.get_stock_latest_quote(request)

            if symbol in quotes:
                quote = quotes[symbol]
                return {
                    "symbol": symbol,
                    "ask_price": float(quote.ask_price),
                    "ask_size": quote.ask_size,
                    "bid_price": float(quote.bid_price),
                    "bid_size": quote.bid_size,
                    "timestamp": quote.timestamp.isoformat() if quote.timestamp else None,
                }
            return None
        except Exception as e:
            logger.error(f"Error getting quote for {symbol}: {e}")
            return None

    def get_latest_quotes(self, symbols: List[str]) -> Dict[str, Dict[str, Any]]:
        """Get latest quotes for multiple symbols"""
        if not self.is_configured():
            return {}

        try:
            request = StockLatestQuoteRequest(symbol_or_symbols=symbols)
            quotes = self.data_client.get_stock_latest_quote(request)

            result = {}
            for symbol, quote in quotes.items():
                result[symbol] = {
                    "symbol": symbol,
                    "ask_price": float(quote.ask_price),
                    "ask_size": quote.ask_size,
                    "bid_price": float(quote.bid_price),
                    "bid_size": quote.bid_size,
                    "mid_price": (float(quote.ask_price) + float(quote.bid_price)) / 2,
                    "timestamp": quote.timestamp.isoformat() if quote.timestamp else None,
                }
            return result
        except Exception as e:
            logger.error(f"Error getting quotes: {e}")
            return {}

    def place_market_order(
        self,
        symbol: str,
        qty: float = None,
        notional: float = None,
        side: str = "buy"
    ) -> Optional[Dict[str, Any]]:
        """
        Place a market order

        Args:
            symbol: Stock symbol (e.g., "VOO")
            qty: Number of shares (use this OR notional)
            notional: Dollar amount to invest (use this OR qty)
            side: "buy" or "sell"

        Returns:
            Order details if successful
        """
        if not self.is_configured():
            return None

        try:
            order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL

            # Build order request
            order_data = {
                "symbol": symbol,
                "side": order_side,
                "time_in_force": TimeInForce.DAY,
            }

            if qty is not None:
                order_data["qty"] = qty
            elif notional is not None:
                order_data["notional"] = notional
            else:
                raise ValueError("Either qty or notional must be provided")

            order_request = MarketOrderRequest(**order_data)
            order = self.trading_client.submit_order(order_request)

            return {
                "id": str(order.id),
                "client_order_id": order.client_order_id,
                "symbol": order.symbol,
                "qty": float(order.qty) if order.qty else None,
                "notional": float(order.notional) if order.notional else None,
                "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else None,
                "side": order.side.value if hasattr(order.side, 'value') else str(order.side),
                "type": order.type.value if hasattr(order.type, 'value') else str(order.type),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "submitted_at": order.submitted_at.isoformat() if order.submitted_at else None,
            }
        except Exception as e:
            logger.error(f"Error placing order for {symbol}: {e}")
            raise

    def execute_portfolio(
        self,
        allocations: Dict[str, float],
        total_investment: float
    ) -> Dict[str, Any]:
        """
        Execute the entire portfolio based on allocations

        Args:
            allocations: Dict of {symbol: weight_percentage} e.g., {"VOO": 25.5, "BND": 15.0}
            total_investment: Total dollar amount to invest

        Returns:
            Summary of all orders placed
        """
        if not self.is_configured():
            return {"success": False, "error": "Alpaca not configured"}

        results = {
            "success": True,
            "total_investment": total_investment,
            "orders": [],
            "errors": [],
            "summary": {
                "total_orders": 0,
                "successful_orders": 0,
                "failed_orders": 0,
            }
        }

        for symbol, weight in allocations.items():
            if weight <= 0:
                continue

            # Calculate dollar amount for this ETF
            notional = (weight / 100) * total_investment

            # Skip very small orders (Alpaca minimum is $1)
            if notional < 1:
                results["errors"].append({
                    "symbol": symbol,
                    "error": f"Order too small (${notional:.2f})"
                })
                continue

            results["summary"]["total_orders"] += 1

            try:
                order = self.place_market_order(
                    symbol=symbol,
                    notional=round(notional, 2),
                    side="buy"
                )

                if order:
                    order["investment_amount"] = round(notional, 2)
                    order["weight"] = weight
                    results["orders"].append(order)
                    results["summary"]["successful_orders"] += 1
            except Exception as e:
                results["errors"].append({
                    "symbol": symbol,
                    "error": str(e)
                })
                results["summary"]["failed_orders"] += 1

        if results["summary"]["failed_orders"] > 0:
            results["success"] = results["summary"]["successful_orders"] > 0

        return results

    def get_orders(self, status: str = "all", limit: int = 50) -> List[Dict[str, Any]]:
        """Get order history"""
        if not self.is_configured():
            return []

        try:
            status_filter = None
            if status == "open":
                status_filter = QueryOrderStatus.OPEN
            elif status == "closed":
                status_filter = QueryOrderStatus.CLOSED
            elif status == "all":
                status_filter = QueryOrderStatus.ALL

            request = GetOrdersRequest(
                status=status_filter,
                limit=limit,
            )

            orders = self.trading_client.get_orders(request)

            return [
                {
                    "id": str(order.id),
                    "symbol": order.symbol,
                    "qty": float(order.qty) if order.qty else None,
                    "notional": float(order.notional) if order.notional else None,
                    "filled_qty": float(order.filled_qty) if order.filled_qty else 0,
                    "filled_avg_price": float(order.filled_avg_price) if order.filled_avg_price else None,
                    "side": order.side.value if hasattr(order.side, 'value') else str(order.side),
                    "type": order.type.value if hasattr(order.type, 'value') else str(order.type),
                    "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                    "filled_at": order.filled_at.isoformat() if order.filled_at else None,
                }
                for order in orders
            ]
        except Exception as e:
            logger.error(f"Error getting orders: {e}")
            raise

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order"""
        if not self.is_configured():
            return False

        try:
            self.trading_client.cancel_order_by_id(order_id)
            return True
        except Exception as e:
            logger.error(f"Error canceling order {order_id}: {e}")
            return False

    def cancel_all_orders(self) -> Dict[str, Any]:
        """Cancel all open orders"""
        if not self.is_configured():
            return {"success": False, "error": "Alpaca not configured"}

        try:
            cancel_statuses = self.trading_client.cancel_orders()
            return {
                "success": True,
                "cancelled_count": len(cancel_statuses) if cancel_statuses else 0
            }
        except Exception as e:
            logger.error(f"Error canceling all orders: {e}")
            return {"success": False, "error": str(e)}

    def close_position(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Close a specific position"""
        if not self.is_configured():
            return None

        try:
            order = self.trading_client.close_position(symbol)
            return {
                "id": str(order.id),
                "symbol": order.symbol,
                "qty": float(order.qty) if order.qty else None,
                "side": order.side.value if hasattr(order.side, 'value') else str(order.side),
                "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            }
        except Exception as e:
            logger.error(f"Error closing position for {symbol}: {e}")
            raise

    def close_all_positions(self) -> Dict[str, Any]:
        """Close all positions (liquidate portfolio)"""
        if not self.is_configured():
            return {"success": False, "error": "Alpaca not configured"}

        try:
            close_responses = self.trading_client.close_all_positions(cancel_orders=True)
            return {
                "success": True,
                "closed_count": len(close_responses) if close_responses else 0
            }
        except Exception as e:
            logger.error(f"Error closing all positions: {e}")
            return {"success": False, "error": str(e)}


# Singleton instance
alpaca_trader = AlpacaTrader()
