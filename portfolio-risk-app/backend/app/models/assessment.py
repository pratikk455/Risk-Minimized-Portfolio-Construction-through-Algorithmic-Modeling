from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Section 1: Personal & Financial Profile (Objective Risk Capacity)
    age_group = Column(Integer, nullable=False)  # 1-10 scale
    investment_horizon = Column(Integer, nullable=False)  # 1-10 scale
    income_stability = Column(Integer, nullable=False)  # 1-10 scale
    emergency_fund = Column(Integer, nullable=False)  # 1-10 scale
    dependents = Column(Integer, nullable=False)  # 1-10 scale
    income_for_investment = Column(Integer, nullable=False)  # 1-10 scale

    # Section 2: Risk Tolerance & Behavioral Tendencies
    reaction_to_volatility = Column(Integer, nullable=False)  # 1-10 scale
    comfort_with_uncertainty = Column(Integer, nullable=False)  # 1-10 scale
    risk_reward_preference = Column(Integer, nullable=False)  # 1-10 scale
    max_drawdown_tolerance = Column(Integer, nullable=False)  # 1-10 scale
    emotional_reaction_speed = Column(Integer, nullable=False)  # 1-10 scale
    loss_aversion = Column(Integer, nullable=False)  # 1-10 scale

    # Section 3: Investment Preferences & Style
    primary_goal = Column(Integer, nullable=False)  # 1-10 scale
    preferred_strategy = Column(Integer, nullable=False)  # 1-10 scale
    views_on_leverage = Column(Integer, nullable=False)  # 1-10 scale
    trading_frequency = Column(Integer, nullable=False)  # 1-10 scale
    diversification_importance = Column(Integer, nullable=False)  # 1-10 scale
    algorithm_trust = Column(Integer, nullable=False)  # 1-10 scale

    # Section 4: Thematic Views (ESG, Crypto, Ethics)
    esg_importance = Column(Integer, nullable=False)  # 1-10 scale
    esg_return_sacrifice = Column(Integer, nullable=False)  # 1-10 scale
    crypto_view = Column(Integer, nullable=False)  # 1-10 scale
    crypto_comfort = Column(Integer, nullable=False)  # 1-10 scale
    alternative_assets_interest = Column(Integer, nullable=False)  # 1-10 scale
    tech_disruption_belief = Column(Integer, nullable=False)  # 1-10 scale

    # Section 5: Financial Literacy & Confidence
    financial_knowledge = Column(Integer, nullable=False)  # 1-10 scale
    market_data_interpretation = Column(Integer, nullable=False)  # 1-10 scale
    decision_confidence = Column(Integer, nullable=False)  # 1-10 scale
    fintech_usage = Column(Integer, nullable=False)  # 1-10 scale

    # Section 6: Time Preference & Future Orientation
    immediate_vs_deferred = Column(Integer, nullable=False)  # 1-10 scale
    retirement_priority = Column(Integer, nullable=False)  # 1-10 scale

    # Computed fields
    overall_risk_score = Column(Float, nullable=True)  # Computed from all responses
    risk_profile = Column(String, nullable=True)  # Conservative, Moderate, Aggressive, etc.

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="assessments")
    portfolios = relationship("Portfolio", back_populates="assessment", cascade="all, delete-orphan")

class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)

    name = Column(String, nullable=False)
    allocations = Column(JSON, nullable=False)

    expected_return = Column(Float)
    expected_volatility = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="portfolios")
    assessment = relationship("Assessment", back_populates="portfolios")