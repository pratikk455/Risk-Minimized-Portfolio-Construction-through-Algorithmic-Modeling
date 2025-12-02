from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.assessment import Assessment, Portfolio
from app.api.routes.auth import get_current_active_user
from app.services.portfolio_optimizer import PortfolioOptimizer, ETF_UNIVERSE

router = APIRouter()


class PortfolioGenerateRequest(BaseModel):
    assessment_id: Optional[int] = None


class ETFAllocation(BaseModel):
    ticker: str
    name: str
    category: str
    weight: float
    expected_return: float
    volatility: float
    risk_level: int


class PortfolioMetrics(BaseModel):
    expected_return: float
    expected_volatility: float
    sharpe_ratio: float
    category_breakdown: dict


class PortfolioResponse(BaseModel):
    id: Optional[int] = None
    risk_profile: str
    risk_score: float
    allocations: List[ETFAllocation]
    metrics: PortfolioMetrics
    ai_recommendation: Optional[str] = None
    created_at: Optional[datetime] = None


@router.post("/generate", response_model=PortfolioResponse)
async def generate_portfolio(
    request: PortfolioGenerateRequest = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Generate an optimized portfolio based on user's risk assessment.
    Uses Sharpe ratio optimization with risk minimization focus.
    """
    # Get the latest assessment or specified one
    if request and request.assessment_id:
        assessment = db.query(Assessment).filter(
            Assessment.id == request.assessment_id,
            Assessment.user_id == current_user.id
        ).first()
    else:
        assessment = db.query(Assessment).filter(
            Assessment.user_id == current_user.id
        ).order_by(Assessment.created_at.desc()).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment found. Please complete the risk questionnaire first."
        )

    # Build assessment data dict for optimizer
    assessment_data = {
        "age_group": assessment.age_group,
        "investment_horizon": assessment.investment_horizon,
        "income_stability": assessment.income_stability,
        "emergency_fund": assessment.emergency_fund,
        "dependents": assessment.dependents,
        "income_for_investment": assessment.income_for_investment,
        "reaction_to_volatility": assessment.reaction_to_volatility,
        "comfort_with_uncertainty": assessment.comfort_with_uncertainty,
        "risk_reward_preference": assessment.risk_reward_preference,
        "max_drawdown_tolerance": assessment.max_drawdown_tolerance,
        "emotional_reaction_speed": assessment.emotional_reaction_speed,
        "loss_aversion": assessment.loss_aversion,
        "primary_goal": assessment.primary_goal,
        "preferred_strategy": assessment.preferred_strategy,
        "views_on_leverage": assessment.views_on_leverage,
        "trading_frequency": assessment.trading_frequency,
        "diversification_importance": assessment.diversification_importance,
        "algorithm_trust": assessment.algorithm_trust,
        "esg_importance": assessment.esg_importance,
        "esg_return_sacrifice": assessment.esg_return_sacrifice,
        "crypto_view": assessment.crypto_view,
        "crypto_comfort": assessment.crypto_comfort,
        "alternative_assets_interest": assessment.alternative_assets_interest,
        "tech_disruption_belief": assessment.tech_disruption_belief,
        "financial_knowledge": assessment.financial_knowledge,
        "market_data_interpretation": assessment.market_data_interpretation,
        "decision_confidence": assessment.decision_confidence,
        "fintech_usage": assessment.fintech_usage,
        "immediate_vs_deferred": assessment.immediate_vs_deferred,
        "retirement_priority": assessment.retirement_priority,
    }

    # Initialize optimizer with Gemini API key
    optimizer = PortfolioOptimizer(gemini_api_key=settings.GEMINI_API_KEY)

    # Generate optimized portfolio
    result = optimizer.optimize_portfolio(
        risk_score=assessment.overall_risk_score,
        risk_profile=assessment.risk_profile,
        assessment_data=assessment_data
    )

    # Get AI recommendation
    ai_recommendation = await optimizer.get_gemini_recommendation(
        risk_profile=assessment.risk_profile,
        risk_score=assessment.overall_risk_score,
        allocations=result["allocations"],
        assessment_summary={
            "investment_horizon": assessment.investment_horizon,
            "primary_goal": assessment.primary_goal
        }
    )

    # Build allocation list with ETF details
    allocations = []
    for ticker, weight in sorted(result["allocations"].items(), key=lambda x: -x[1]):
        if ticker in ETF_UNIVERSE and weight > 0:
            etf_data = ETF_UNIVERSE[ticker]
            allocations.append(ETFAllocation(
                ticker=ticker,
                name=etf_data["name"],
                category=etf_data["category"],
                weight=round(weight * 100, 2),  # Convert to percentage
                expected_return=round(etf_data["expected_return"] * 100, 2),
                volatility=round(etf_data["volatility"] * 100, 2),
                risk_level=etf_data["risk_level"]
            ))

    # Save portfolio to database
    db_portfolio = Portfolio(
        user_id=current_user.id,
        assessment_id=assessment.id,
        name=f"{assessment.risk_profile} Portfolio",
        allocations={a.ticker: a.weight for a in allocations},
        expected_return=result["metrics"]["expected_return"],
        expected_volatility=result["metrics"]["expected_volatility"],
        sharpe_ratio=result["metrics"]["sharpe_ratio"],
        is_active=True
    )

    # Deactivate previous portfolios
    db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_active == True
    ).update({"is_active": False})

    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)

    return PortfolioResponse(
        id=db_portfolio.id,
        risk_profile=assessment.risk_profile,
        risk_score=assessment.overall_risk_score,
        allocations=allocations,
        metrics=PortfolioMetrics(
            expected_return=round(result["metrics"]["expected_return"] * 100, 2),
            expected_volatility=round(result["metrics"]["expected_volatility"] * 100, 2),
            sharpe_ratio=round(result["metrics"]["sharpe_ratio"], 2),
            category_breakdown={
                k: round(v * 100, 1)
                for k, v in result["metrics"]["category_breakdown"].items()
            }
        ),
        ai_recommendation=ai_recommendation,
        created_at=db_portfolio.created_at
    )


@router.get("/active", response_model=Optional[PortfolioResponse])
async def get_active_portfolio(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get the user's active portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id,
        Portfolio.is_active == True
    ).first()

    if not portfolio:
        return None

    # Get the associated assessment
    assessment = db.query(Assessment).filter(
        Assessment.id == portfolio.assessment_id
    ).first()

    # Build allocation list
    allocations = []
    for ticker, weight in sorted(portfolio.allocations.items(), key=lambda x: -x[1]):
        if ticker in ETF_UNIVERSE:
            etf_data = ETF_UNIVERSE[ticker]
            allocations.append(ETFAllocation(
                ticker=ticker,
                name=etf_data["name"],
                category=etf_data["category"],
                weight=weight,
                expected_return=round(etf_data["expected_return"] * 100, 2),
                volatility=round(etf_data["volatility"] * 100, 2),
                risk_level=etf_data["risk_level"]
            ))

    return PortfolioResponse(
        id=portfolio.id,
        risk_profile=assessment.risk_profile if assessment else "Unknown",
        risk_score=assessment.overall_risk_score if assessment else 0,
        allocations=allocations,
        metrics=PortfolioMetrics(
            expected_return=round(portfolio.expected_return * 100, 2) if portfolio.expected_return else 0,
            expected_volatility=round(portfolio.expected_volatility * 100, 2) if portfolio.expected_volatility else 0,
            sharpe_ratio=round(portfolio.sharpe_ratio, 2) if portfolio.sharpe_ratio else 0,
            category_breakdown={}
        ),
        created_at=portfolio.created_at
    )


@router.get("/history")
async def get_portfolio_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get all portfolios for the current user"""
    portfolios = db.query(Portfolio).filter(
        Portfolio.user_id == current_user.id
    ).order_by(Portfolio.created_at.desc()).all()

    return {"portfolios": portfolios}


@router.get("/etfs")
async def get_etf_universe() -> Any:
    """Get all available ETFs in the universe"""
    etfs = []
    for ticker, data in ETF_UNIVERSE.items():
        etfs.append({
            "ticker": ticker,
            "name": data["name"],
            "category": data["category"],
            "risk_level": data["risk_level"],
            "expected_return": round(data["expected_return"] * 100, 2),
            "volatility": round(data["volatility"] * 100, 2)
        })

    # Sort by category then by risk level
    etfs.sort(key=lambda x: (x["category"], x["risk_level"]))

    return {
        "etfs": etfs,
        "categories": {
            "bonds": [e for e in etfs if e["category"] == "bonds"],
            "stocks": [e for e in etfs if e["category"] == "stocks"],
            "alternatives": [e for e in etfs if e["category"] == "alternatives"]
        }
    }
