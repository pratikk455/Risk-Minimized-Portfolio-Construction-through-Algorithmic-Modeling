"""
Portfolio Optimization Service
Uses Sharpe ratio optimization with risk-focused allocation for student investors.
Integrates with Gemini AI for personalized recommendations.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
import logging
import httpx
import json

logger = logging.getLogger(__name__)

# ETF Universe - Diversified across asset classes
ETF_UNIVERSE = {
    # Bond ETFs (Lower Risk)
    "BND": {"name": "Vanguard Total Bond Market", "category": "bonds", "risk_level": 1, "expected_return": 0.04, "volatility": 0.05},
    "TLT": {"name": "iShares 20+ Year Treasury Bond", "category": "bonds", "risk_level": 2, "expected_return": 0.035, "volatility": 0.12},
    "HYG": {"name": "iShares High Yield Corporate Bond", "category": "bonds", "risk_level": 3, "expected_return": 0.055, "volatility": 0.08},
    "TIP": {"name": "iShares TIPS Bond", "category": "bonds", "risk_level": 1, "expected_return": 0.03, "volatility": 0.05},
    "SHY": {"name": "iShares 1-3 Year Treasury Bond", "category": "bonds", "risk_level": 1, "expected_return": 0.025, "volatility": 0.02},

    # Stock ETFs (Medium to High Risk)
    "VOO": {"name": "Vanguard S&P 500", "category": "stocks", "risk_level": 5, "expected_return": 0.10, "volatility": 0.15},
    "QQQ": {"name": "Invesco QQQ (Nasdaq-100)", "category": "stocks", "risk_level": 6, "expected_return": 0.12, "volatility": 0.20},
    "VTI": {"name": "Vanguard Total Stock Market", "category": "stocks", "risk_level": 5, "expected_return": 0.095, "volatility": 0.15},
    "VXUS": {"name": "Vanguard Total International Stock", "category": "stocks", "risk_level": 6, "expected_return": 0.08, "volatility": 0.17},
    "VWO": {"name": "Vanguard Emerging Markets", "category": "stocks", "risk_level": 8, "expected_return": 0.09, "volatility": 0.22},
    "VTV": {"name": "Vanguard Value", "category": "stocks", "risk_level": 4, "expected_return": 0.085, "volatility": 0.14},
    "SCHD": {"name": "Schwab US Dividend Equity", "category": "stocks", "risk_level": 4, "expected_return": 0.09, "volatility": 0.13},
    "ARKK": {"name": "ARK Innovation", "category": "stocks", "risk_level": 9, "expected_return": 0.15, "volatility": 0.35},
    "XLE": {"name": "Energy Select Sector SPDR", "category": "stocks", "risk_level": 7, "expected_return": 0.08, "volatility": 0.25},
    "XLU": {"name": "Utilities Select Sector SPDR", "category": "stocks", "risk_level": 3, "expected_return": 0.06, "volatility": 0.12},

    # Alternative ETFs (Various Risk Levels)
    "GLD": {"name": "SPDR Gold Shares", "category": "alternatives", "risk_level": 4, "expected_return": 0.05, "volatility": 0.15},
    "BITO": {"name": "ProShares Bitcoin Strategy", "category": "alternatives", "risk_level": 10, "expected_return": 0.20, "volatility": 0.60},
    "DBC": {"name": "Invesco DB Commodity Index", "category": "alternatives", "risk_level": 6, "expected_return": 0.04, "volatility": 0.18},
    "VNQ": {"name": "Vanguard Real Estate", "category": "alternatives", "risk_level": 5, "expected_return": 0.07, "volatility": 0.18},
    "PDBC": {"name": "Invesco Optimum Yield Diversified Commodity", "category": "alternatives", "risk_level": 6, "expected_return": 0.045, "volatility": 0.16},
}

# Risk-free rate assumption (Treasury yield)
RISK_FREE_RATE = 0.045  # 4.5% (current T-bill rate approximation)


class PortfolioOptimizer:
    """
    Portfolio optimizer using risk-adjusted returns (Sharpe Ratio)
    Focuses on minimizing risk while achieving reasonable returns for students.
    """

    def __init__(self, gemini_api_key: str = None):
        self.etf_universe = ETF_UNIVERSE
        self.risk_free_rate = RISK_FREE_RATE
        self.gemini_api_key = gemini_api_key

    def calculate_sharpe_ratio(self, expected_return: float, volatility: float) -> float:
        """Calculate Sharpe ratio for a given return and volatility"""
        if volatility == 0:
            return 0
        return (expected_return - self.risk_free_rate) / volatility

    def get_risk_profile_parameters(self, risk_score: float, risk_profile: str) -> Dict:
        """
        Map risk score to allocation parameters.
        Lower scores = more conservative = higher bond allocation.
        """
        # For students, we bias toward conservative allocations
        # Risk score is 1-10, where 1 is very conservative

        if risk_score <= 3:  # Very Conservative
            return {
                "max_stock_allocation": 0.25,
                "min_bond_allocation": 0.55,
                "max_alternative_allocation": 0.10,
                "max_single_etf": 0.20,
                "max_volatility": 0.08,
                "risk_penalty": 2.0  # Heavy penalty for risk
            }
        elif risk_score <= 4.5:  # Conservative
            return {
                "max_stock_allocation": 0.40,
                "min_bond_allocation": 0.40,
                "max_alternative_allocation": 0.15,
                "max_single_etf": 0.20,
                "max_volatility": 0.10,
                "risk_penalty": 1.5
            }
        elif risk_score <= 6:  # Moderate
            return {
                "max_stock_allocation": 0.55,
                "min_bond_allocation": 0.25,
                "max_alternative_allocation": 0.20,
                "max_single_etf": 0.25,
                "max_volatility": 0.14,
                "risk_penalty": 1.0
            }
        elif risk_score <= 7.5:  # Aggressive
            return {
                "max_stock_allocation": 0.70,
                "min_bond_allocation": 0.15,
                "max_alternative_allocation": 0.25,
                "max_single_etf": 0.30,
                "max_volatility": 0.18,
                "risk_penalty": 0.7
            }
        else:  # Very Aggressive
            return {
                "max_stock_allocation": 0.85,
                "min_bond_allocation": 0.05,
                "max_alternative_allocation": 0.30,
                "max_single_etf": 0.35,
                "max_volatility": 0.25,
                "risk_penalty": 0.5
            }

    def filter_etfs_by_risk(self, max_risk_level: int, assessment_data: dict = None) -> List[str]:
        """Filter ETFs based on maximum acceptable risk level and user preferences"""
        eligible_etfs = []

        for ticker, data in self.etf_universe.items():
            if data["risk_level"] <= max_risk_level:
                eligible_etfs.append(ticker)

        # If user has specific preferences (e.g., crypto comfort), adjust
        if assessment_data:
            crypto_comfort = assessment_data.get("crypto_comfort", 1)
            if crypto_comfort < 5 and "BITO" in eligible_etfs:
                eligible_etfs.remove("BITO")

        return eligible_etfs

    def optimize_portfolio(
        self,
        risk_score: float,
        risk_profile: str,
        assessment_data: dict = None
    ) -> Dict:
        """
        Main optimization function.
        Uses risk-adjusted Sharpe ratio optimization with risk minimization focus.
        """
        params = self.get_risk_profile_parameters(risk_score, risk_profile)

        # Determine max ETF risk level based on user's risk score
        max_etf_risk = min(10, int(risk_score * 1.2) + 2)
        eligible_etfs = self.filter_etfs_by_risk(max_etf_risk, assessment_data)

        # Calculate risk-adjusted scores for each eligible ETF
        etf_scores = {}
        for ticker in eligible_etfs:
            etf_data = self.etf_universe[ticker]
            sharpe = self.calculate_sharpe_ratio(
                etf_data["expected_return"],
                etf_data["volatility"]
            )
            # Apply risk penalty - lower volatility gets bonus
            risk_adjusted_score = sharpe - (params["risk_penalty"] * etf_data["volatility"])
            etf_scores[ticker] = {
                "sharpe_ratio": sharpe,
                "risk_adjusted_score": risk_adjusted_score,
                "category": etf_data["category"],
                **etf_data
            }

        # Allocate based on category constraints and risk-adjusted scores
        allocations = self._allocate_by_category(etf_scores, params, assessment_data)

        # Calculate portfolio metrics
        portfolio_metrics = self._calculate_portfolio_metrics(allocations)

        return {
            "allocations": allocations,
            "metrics": portfolio_metrics,
            "risk_profile": risk_profile,
            "risk_score": risk_score,
            "parameters_used": params
        }

    def _allocate_by_category(
        self,
        etf_scores: Dict,
        params: Dict,
        assessment_data: dict = None
    ) -> Dict:
        """Allocate weights respecting category constraints"""

        # Group ETFs by category
        bonds = {k: v for k, v in etf_scores.items() if v["category"] == "bonds"}
        stocks = {k: v for k, v in etf_scores.items() if v["category"] == "stocks"}
        alternatives = {k: v for k, v in etf_scores.items() if v["category"] == "alternatives"}

        allocations = {}

        # Sort each category by risk-adjusted score
        sorted_bonds = sorted(bonds.items(), key=lambda x: x[1]["risk_adjusted_score"], reverse=True)
        sorted_stocks = sorted(stocks.items(), key=lambda x: x[1]["risk_adjusted_score"], reverse=True)
        sorted_alternatives = sorted(alternatives.items(), key=lambda x: x[1]["risk_adjusted_score"], reverse=True)

        # Allocate bonds (minimum required)
        bond_allocation = params["min_bond_allocation"]
        remaining = 1.0 - bond_allocation

        # Allocate stocks (up to max)
        stock_allocation = min(params["max_stock_allocation"], remaining * 0.7)
        remaining -= stock_allocation

        # Allocate alternatives (remainder, up to max)
        alt_allocation = min(params["max_alternative_allocation"], remaining)

        # Redistribute any remaining to bonds (safest)
        remaining = 1.0 - bond_allocation - stock_allocation - alt_allocation
        bond_allocation += remaining

        # Distribute within each category based on scores
        allocations.update(self._distribute_within_category(
            sorted_bonds[:4], bond_allocation, params["max_single_etf"]
        ))
        allocations.update(self._distribute_within_category(
            sorted_stocks[:5], stock_allocation, params["max_single_etf"]
        ))
        allocations.update(self._distribute_within_category(
            sorted_alternatives[:3], alt_allocation, params["max_single_etf"]
        ))

        # Normalize to ensure sum = 1.0
        total = sum(allocations.values())
        if total > 0:
            allocations = {k: round(v / total, 4) for k, v in allocations.items()}

        return allocations

    def _distribute_within_category(
        self,
        sorted_etfs: List[Tuple],
        total_allocation: float,
        max_single: float
    ) -> Dict:
        """Distribute allocation within a category based on scores"""
        if not sorted_etfs or total_allocation <= 0:
            return {}

        allocations = {}

        # Calculate total score for weighting
        total_score = sum(max(0.1, etf[1]["risk_adjusted_score"]) for etf in sorted_etfs)

        for ticker, data in sorted_etfs:
            # Weight by risk-adjusted score
            score = max(0.1, data["risk_adjusted_score"])
            weight = (score / total_score) * total_allocation

            # Cap at max single ETF allocation
            weight = min(weight, max_single)

            if weight > 0.01:  # Only include if > 1%
                allocations[ticker] = weight

        return allocations

    def _calculate_portfolio_metrics(self, allocations: Dict) -> Dict:
        """Calculate expected return, volatility, and Sharpe ratio for portfolio"""
        if not allocations:
            return {
                "expected_return": 0,
                "expected_volatility": 0,
                "sharpe_ratio": 0,
                "category_breakdown": {}
            }

        expected_return = 0
        weighted_volatility = 0
        category_breakdown = {"bonds": 0, "stocks": 0, "alternatives": 0}

        for ticker, weight in allocations.items():
            if ticker in self.etf_universe:
                etf_data = self.etf_universe[ticker]
                expected_return += weight * etf_data["expected_return"]
                weighted_volatility += weight * etf_data["volatility"]
                category_breakdown[etf_data["category"]] += weight

        sharpe_ratio = self.calculate_sharpe_ratio(expected_return, weighted_volatility)

        return {
            "expected_return": round(expected_return, 4),
            "expected_volatility": round(weighted_volatility, 4),
            "sharpe_ratio": round(sharpe_ratio, 4),
            "category_breakdown": {k: round(v, 4) for k, v in category_breakdown.items()}
        }

    async def get_gemini_recommendation(
        self,
        risk_profile: str,
        risk_score: float,
        allocations: Dict,
        assessment_summary: Dict
    ) -> Optional[str]:
        """Get personalized recommendation from Gemini AI"""
        if not self.gemini_api_key:
            return None

        try:
            # Build allocation summary
            allocation_text = "\n".join([
                f"- {ticker}: {weight*100:.1f}% ({self.etf_universe[ticker]['name']})"
                for ticker, weight in sorted(allocations.items(), key=lambda x: -x[1])
                if weight > 0
            ])

            prompt = f"""You are a financial advisor helping a student investor. Based on their risk assessment, provide a brief, encouraging explanation of their personalized portfolio.

Risk Profile: {risk_profile}
Risk Score: {risk_score}/10
Investment Horizon: {assessment_summary.get('investment_horizon', 'Medium-term')}

Portfolio Allocation:
{allocation_text}

Please provide:
1. A 2-3 sentence explanation of why this allocation suits their risk profile
2. One key benefit of this portfolio for a student
3. One simple tip for managing this portfolio

Keep it concise, encouraging, and student-friendly. Avoid jargon. Focus on education and long-term growth."""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_api_key}",
                    json={
                        "contents": [{
                            "parts": [{"text": prompt}]
                        }]
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    result = response.json()
                    if "candidates" in result and len(result["candidates"]) > 0:
                        return result["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}")

        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")

        return None


def get_portfolio_allocation(
    risk_score: float,
    risk_profile: str,
    assessment_data: dict = None,
    gemini_api_key: str = None
) -> Dict:
    """
    Convenience function to get portfolio allocation.

    Args:
        risk_score: User's risk score (1-10)
        risk_profile: Risk profile string (e.g., "Conservative", "Moderate")
        assessment_data: Optional dict of all assessment answers
        gemini_api_key: Optional Gemini API key for AI recommendations

    Returns:
        Dict containing allocations and portfolio metrics
    """
    optimizer = PortfolioOptimizer(gemini_api_key=gemini_api_key)
    return optimizer.optimize_portfolio(risk_score, risk_profile, assessment_data)
