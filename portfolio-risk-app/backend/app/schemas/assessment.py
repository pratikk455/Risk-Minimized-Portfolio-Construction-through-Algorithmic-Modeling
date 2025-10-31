from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class AssessmentCreate(BaseModel):
    """Schema for creating a new risk assessment questionnaire response"""

    # Section 1: Personal & Financial Profile (Objective Risk Capacity)
    age_group: int = Field(..., ge=1, le=10, description="Age group (1=70+, 10=Under 25)")
    investment_horizon: int = Field(..., ge=1, le=10, description="Investment horizon (1=<2 years, 10=>20 years)")
    income_stability: int = Field(..., ge=1, le=10, description="Income stability (1=Unstable, 10=Very stable)")
    emergency_fund: int = Field(..., ge=1, le=10, description="Emergency fund (1=None, 10=>2 years expenses)")
    dependents: int = Field(..., ge=1, le=10, description="Dependents (1=Many, 10=None)")
    income_for_investment: int = Field(..., ge=1, le=10, description="Income for investment (1=<5%, 10=>50%)")

    # Section 2: Risk Tolerance & Behavioral Tendencies
    reaction_to_volatility: int = Field(..., ge=1, le=10, description="Reaction to 20% drop (1=Sell all, 10=Buy more)")
    comfort_with_uncertainty: int = Field(..., ge=1, le=10, description="Comfort with uncertainty (1=Disagree, 10=Agree)")
    risk_reward_preference: int = Field(..., ge=1, le=10, description="Risk preference (1=Stable 3-5%, 10=Uncertain 15-20%)")
    max_drawdown_tolerance: int = Field(..., ge=1, le=10, description="Max drawdown tolerance (1=<5%, 10=>40%)")
    emotional_reaction_speed: int = Field(..., ge=1, le=10, description="Emotional reaction (1=Reactive, 10=Calm)")
    loss_aversion: int = Field(..., ge=1, le=10, description="Loss aversion (1=High, 10=Low)")

    # Section 3: Investment Preferences & Style
    primary_goal: int = Field(..., ge=1, le=10, description="Primary goal (1=Preservation, 5=Balanced, 10=Maximization)")
    preferred_strategy: int = Field(..., ge=1, le=10, description="Strategy preference (1=Passive, 10=Active/Alternative)")
    views_on_leverage: int = Field(..., ge=1, le=10, description="Leverage views (1=Never, 10=Fully comfortable)")
    trading_frequency: int = Field(..., ge=1, le=10, description="Trading frequency (1=Buy-hold, 10=Active trader)")
    diversification_importance: int = Field(..., ge=1, le=10, description="Diversification (1=Few bets, 10=Wide diversification)")
    algorithm_trust: int = Field(..., ge=1, le=10, description="Algorithm trust (1=Disagree, 10=Fully trust)")

    # Section 4: Thematic Views (ESG, Crypto, Ethics)
    esg_importance: int = Field(..., ge=1, le=10, description="ESG importance (1=Not important, 10=Extremely important)")
    esg_return_sacrifice: int = Field(..., ge=1, le=10, description="ESG sacrifice (1=Never, 10=Fully willing)")
    crypto_view: int = Field(..., ge=1, le=10, description="Crypto view (1=Speculative, 10=Legitimate)")
    crypto_comfort: int = Field(..., ge=1, le=10, description="Crypto allocation (1=0%, 10=>20%)")
    alternative_assets_interest: int = Field(..., ge=1, le=10, description="Alternative assets (1=No interest, 10=Very open)")
    tech_disruption_belief: int = Field(..., ge=1, le=10, description="Tech disruption (1=Skeptical, 10=Optimistic)")

    # Section 5: Financial Literacy & Confidence
    financial_knowledge: int = Field(..., ge=1, le=10, description="Financial knowledge (1=Beginner, 10=Expert)")
    market_data_interpretation: int = Field(..., ge=1, le=10, description="Market data skills (1=Rely on others, 10=Expert)")
    decision_confidence: int = Field(..., ge=1, le=10, description="Decision confidence (1=Dependent, 10=Self-reliant)")
    fintech_usage: int = Field(..., ge=1, le=10, description="Fintech usage (1=None, 10=Heavy user)")

    # Section 6: Time Preference & Future Orientation
    immediate_vs_deferred: int = Field(..., ge=1, le=10, description="Time preference (1=Immediate, 10=Deferred gains)")
    retirement_priority: int = Field(..., ge=1, le=10, description="Retirement planning (1=Not planning, 10=Fully focused)")

    @field_validator('*')
    @classmethod
    def validate_scale(cls, v: int) -> int:
        """Ensure all fields are within 1-10 range"""
        if not isinstance(v, int) or v < 1 or v > 10:
            raise ValueError('All responses must be integers between 1 and 10')
        return v


class AssessmentResponse(BaseModel):
    """Schema for assessment response"""

    id: int
    user_id: int

    # All questionnaire fields
    age_group: int
    investment_horizon: int
    income_stability: int
    emergency_fund: int
    dependents: int
    income_for_investment: int

    reaction_to_volatility: int
    comfort_with_uncertainty: int
    risk_reward_preference: int
    max_drawdown_tolerance: int
    emotional_reaction_speed: int
    loss_aversion: int

    primary_goal: int
    preferred_strategy: int
    views_on_leverage: int
    trading_frequency: int
    diversification_importance: int
    algorithm_trust: int

    esg_importance: int
    esg_return_sacrifice: int
    crypto_view: int
    crypto_comfort: int
    alternative_assets_interest: int
    tech_disruption_belief: int

    financial_knowledge: int
    market_data_interpretation: int
    decision_confidence: int
    fintech_usage: int

    immediate_vs_deferred: int
    retirement_priority: int

    # Computed fields
    overall_risk_score: Optional[float] = None
    risk_profile: Optional[str] = None

    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssessmentSummary(BaseModel):
    """Brief summary of an assessment"""
    id: int
    overall_risk_score: Optional[float]
    risk_profile: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
