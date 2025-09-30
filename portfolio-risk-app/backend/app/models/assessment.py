from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    risk_tolerance_score = Column(Float, nullable=False)
    time_horizon_years = Column(Integer, nullable=False)
    investment_experience = Column(String, nullable=False)
    investment_goals = Column(JSON, nullable=False)

    liquidity_needs = Column(String)
    income_stability = Column(String)
    age = Column(Integer)
    current_assets = Column(Float)

    responses = Column(JSON, nullable=False)

    risk_profile = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

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