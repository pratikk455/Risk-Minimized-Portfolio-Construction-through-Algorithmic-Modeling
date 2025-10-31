from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.assessment import Assessment
from app.schemas.assessment import AssessmentCreate, AssessmentResponse, AssessmentSummary
from app.api.routes.auth import get_current_active_user

router = APIRouter()


def calculate_risk_score(assessment_data: AssessmentCreate) -> tuple[float, str]:
    """
    Calculate overall risk score and profile from questionnaire responses.
    Returns (risk_score, risk_profile)
    """
    # Weight different sections
    section_weights = {
        'capacity': 0.25,  # Financial capacity to take risk
        'tolerance': 0.35,  # Psychological tolerance for risk
        'preferences': 0.20,  # Investment preferences
        'thematic': 0.10,  # ESG, crypto, alternatives
        'literacy': 0.05,  # Financial knowledge
        'time': 0.05  # Time preferences
    }

    # Section 1: Personal & Financial Profile (Capacity)
    capacity_score = (
        assessment_data.age_group +
        assessment_data.investment_horizon +
        assessment_data.income_stability +
        assessment_data.emergency_fund +
        assessment_data.dependents +
        assessment_data.income_for_investment
    ) / 6

    # Section 2: Risk Tolerance & Behavioral Tendencies
    tolerance_score = (
        assessment_data.reaction_to_volatility +
        assessment_data.comfort_with_uncertainty +
        assessment_data.risk_reward_preference +
        assessment_data.max_drawdown_tolerance +
        assessment_data.emotional_reaction_speed +
        assessment_data.loss_aversion
    ) / 6

    # Section 3: Investment Preferences & Style
    preferences_score = (
        assessment_data.primary_goal +
        assessment_data.preferred_strategy +
        assessment_data.views_on_leverage +
        assessment_data.trading_frequency +
        assessment_data.diversification_importance +
        assessment_data.algorithm_trust
    ) / 6

    # Section 4: Thematic Views
    thematic_score = (
        assessment_data.crypto_view +
        assessment_data.crypto_comfort +
        assessment_data.alternative_assets_interest +
        assessment_data.tech_disruption_belief
    ) / 4

    # Section 5: Financial Literacy
    literacy_score = (
        assessment_data.financial_knowledge +
        assessment_data.market_data_interpretation +
        assessment_data.decision_confidence +
        assessment_data.fintech_usage
    ) / 4

    # Section 6: Time Preference
    time_score = (
        assessment_data.immediate_vs_deferred +
        assessment_data.retirement_priority
    ) / 2

    # Calculate weighted overall score (1-10 scale)
    overall_score = (
        capacity_score * section_weights['capacity'] +
        tolerance_score * section_weights['tolerance'] +
        preferences_score * section_weights['preferences'] +
        thematic_score * section_weights['thematic'] +
        literacy_score * section_weights['literacy'] +
        time_score * section_weights['time']
    )

    # Determine risk profile based on score
    if overall_score <= 3:
        risk_profile = "Very Conservative"
    elif overall_score <= 4.5:
        risk_profile = "Conservative"
    elif overall_score <= 6:
        risk_profile = "Moderate"
    elif overall_score <= 7.5:
        risk_profile = "Aggressive"
    else:
        risk_profile = "Very Aggressive"

    return round(overall_score, 2), risk_profile


@router.post("/submit", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def submit_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Submit a complete risk assessment questionnaire.
    Calculates risk score and profile, stores in database.
    """
    # Calculate risk score and profile
    risk_score, risk_profile = calculate_risk_score(assessment_data)

    # Create assessment record
    db_assessment = Assessment(
        user_id=current_user.id,
        # Section 1
        age_group=assessment_data.age_group,
        investment_horizon=assessment_data.investment_horizon,
        income_stability=assessment_data.income_stability,
        emergency_fund=assessment_data.emergency_fund,
        dependents=assessment_data.dependents,
        income_for_investment=assessment_data.income_for_investment,
        # Section 2
        reaction_to_volatility=assessment_data.reaction_to_volatility,
        comfort_with_uncertainty=assessment_data.comfort_with_uncertainty,
        risk_reward_preference=assessment_data.risk_reward_preference,
        max_drawdown_tolerance=assessment_data.max_drawdown_tolerance,
        emotional_reaction_speed=assessment_data.emotional_reaction_speed,
        loss_aversion=assessment_data.loss_aversion,
        # Section 3
        primary_goal=assessment_data.primary_goal,
        preferred_strategy=assessment_data.preferred_strategy,
        views_on_leverage=assessment_data.views_on_leverage,
        trading_frequency=assessment_data.trading_frequency,
        diversification_importance=assessment_data.diversification_importance,
        algorithm_trust=assessment_data.algorithm_trust,
        # Section 4
        esg_importance=assessment_data.esg_importance,
        esg_return_sacrifice=assessment_data.esg_return_sacrifice,
        crypto_view=assessment_data.crypto_view,
        crypto_comfort=assessment_data.crypto_comfort,
        alternative_assets_interest=assessment_data.alternative_assets_interest,
        tech_disruption_belief=assessment_data.tech_disruption_belief,
        # Section 5
        financial_knowledge=assessment_data.financial_knowledge,
        market_data_interpretation=assessment_data.market_data_interpretation,
        decision_confidence=assessment_data.decision_confidence,
        fintech_usage=assessment_data.fintech_usage,
        # Section 6
        immediate_vs_deferred=assessment_data.immediate_vs_deferred,
        retirement_priority=assessment_data.retirement_priority,
        # Computed fields
        overall_risk_score=risk_score,
        risk_profile=risk_profile,
        completed_at=datetime.utcnow()
    )

    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)

    return db_assessment


@router.get("/history", response_model=List[AssessmentSummary])
async def get_assessment_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get all assessments for the current user"""
    assessments = db.query(Assessment).filter(
        Assessment.user_id == current_user.id
    ).order_by(Assessment.created_at.desc()).all()

    return assessments


@router.get("/latest", response_model=AssessmentResponse)
async def get_latest_assessment(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get the most recent assessment for the current user"""
    assessment = db.query(Assessment).filter(
        Assessment.user_id == current_user.id
    ).order_by(Assessment.created_at.desc()).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment found. Please complete the questionnaire first."
        )

    return assessment


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get a specific assessment by ID"""
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.user_id == current_user.id
    ).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    return assessment