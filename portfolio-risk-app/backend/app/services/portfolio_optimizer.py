"""
Portfolio Optimization Service
Implements Hierarchical Risk Parity (HRP) and Modified Markowitz optimization
for risk-minimized portfolio construction targeting student investors.

References:
- Lopez de Prado (2016): "Building Diversified Portfolios that Outperform Out-of-Sample"
- Markowitz (1952): "Portfolio Selection"
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import logging
import httpx
import json
from enum import Enum

# PyPortfolioOpt imports for professional optimization
from pypfopt import HRPOpt, EfficientFrontier, risk_models, expected_returns
from pypfopt.hierarchical_portfolio import HRPOpt
from pypfopt.efficient_frontier import EfficientFrontier
from scipy.cluster.hierarchy import linkage, dendrogram
from scipy.spatial.distance import squareform

logger = logging.getLogger(__name__)


class OptimizationMethod(str, Enum):
    HRP = "hrp"  # Hierarchical Risk Parity
    MARKOWITZ = "markowitz"  # Mean-Variance Optimization
    HYBRID = "hybrid"  # Combine both methods


# ETF Universe - Diversified across asset classes
# Historical data used for expected returns and volatility estimates
ETF_UNIVERSE = {
    # Bond ETFs (Lower Risk)
    "BND": {
        "name": "Vanguard Total Bond Market",
        "category": "bonds",
        "risk_level": 1,
        "expected_return": 0.04,
        "volatility": 0.05,
        "description": "Broad exposure to U.S. investment-grade bonds"
    },
    "TLT": {
        "name": "iShares 20+ Year Treasury Bond",
        "category": "bonds",
        "risk_level": 2,
        "expected_return": 0.035,
        "volatility": 0.12,
        "description": "Long-term U.S. Treasury bonds, interest rate sensitive"
    },
    "HYG": {
        "name": "iShares High Yield Corporate Bond",
        "category": "bonds",
        "risk_level": 3,
        "expected_return": 0.055,
        "volatility": 0.08,
        "description": "Higher yield but more credit risk than investment-grade"
    },
    "TIP": {
        "name": "iShares TIPS Bond",
        "category": "bonds",
        "risk_level": 1,
        "expected_return": 0.03,
        "volatility": 0.05,
        "description": "Inflation-protected Treasury bonds"
    },
    "SHY": {
        "name": "iShares 1-3 Year Treasury Bond",
        "category": "bonds",
        "risk_level": 1,
        "expected_return": 0.025,
        "volatility": 0.02,
        "description": "Short-term Treasuries, very low risk"
    },

    # Stock ETFs (Medium to High Risk)
    "VOO": {
        "name": "Vanguard S&P 500",
        "category": "stocks",
        "risk_level": 5,
        "expected_return": 0.10,
        "volatility": 0.15,
        "description": "Tracks 500 largest U.S. companies"
    },
    "QQQ": {
        "name": "Invesco QQQ (Nasdaq-100)",
        "category": "stocks",
        "risk_level": 6,
        "expected_return": 0.12,
        "volatility": 0.20,
        "description": "Tech-heavy, tracks Nasdaq-100 index"
    },
    "VTI": {
        "name": "Vanguard Total Stock Market",
        "category": "stocks",
        "risk_level": 5,
        "expected_return": 0.095,
        "volatility": 0.15,
        "description": "Entire U.S. stock market exposure"
    },
    "VXUS": {
        "name": "Vanguard Total International Stock",
        "category": "stocks",
        "risk_level": 6,
        "expected_return": 0.08,
        "volatility": 0.17,
        "description": "International stocks excluding U.S."
    },
    "VWO": {
        "name": "Vanguard Emerging Markets",
        "category": "stocks",
        "risk_level": 8,
        "expected_return": 0.09,
        "volatility": 0.22,
        "description": "Emerging market stocks, higher growth potential and risk"
    },
    "VTV": {
        "name": "Vanguard Value",
        "category": "stocks",
        "risk_level": 4,
        "expected_return": 0.085,
        "volatility": 0.14,
        "description": "U.S. large-cap value stocks"
    },
    "SCHD": {
        "name": "Schwab US Dividend Equity",
        "category": "stocks",
        "risk_level": 4,
        "expected_return": 0.09,
        "volatility": 0.13,
        "description": "High-quality dividend-paying stocks"
    },
    "ARKK": {
        "name": "ARK Innovation",
        "category": "stocks",
        "risk_level": 9,
        "expected_return": 0.15,
        "volatility": 0.35,
        "description": "Disruptive innovation focus, very high risk"
    },
    "XLE": {
        "name": "Energy Select Sector SPDR",
        "category": "stocks",
        "risk_level": 7,
        "expected_return": 0.08,
        "volatility": 0.25,
        "description": "Energy sector stocks"
    },
    "XLU": {
        "name": "Utilities Select Sector SPDR",
        "category": "stocks",
        "risk_level": 3,
        "expected_return": 0.06,
        "volatility": 0.12,
        "description": "Utility companies, defensive sector"
    },

    # Alternative ETFs (Various Risk Levels)
    "GLD": {
        "name": "SPDR Gold Shares",
        "category": "alternatives",
        "risk_level": 4,
        "expected_return": 0.05,
        "volatility": 0.15,
        "description": "Gold bullion, inflation hedge"
    },
    "BITO": {
        "name": "ProShares Bitcoin Strategy",
        "category": "alternatives",
        "risk_level": 10,
        "expected_return": 0.20,
        "volatility": 0.60,
        "description": "Bitcoin futures exposure, extremely volatile"
    },
    "DBC": {
        "name": "Invesco DB Commodity Index",
        "category": "alternatives",
        "risk_level": 6,
        "expected_return": 0.04,
        "volatility": 0.18,
        "description": "Broad commodity exposure"
    },
    "VNQ": {
        "name": "Vanguard Real Estate",
        "category": "alternatives",
        "risk_level": 5,
        "expected_return": 0.07,
        "volatility": 0.18,
        "description": "Real estate investment trusts (REITs)"
    },
    "PDBC": {
        "name": "Invesco Optimum Yield Diversified Commodity",
        "category": "alternatives",
        "risk_level": 6,
        "expected_return": 0.045,
        "volatility": 0.16,
        "description": "Diversified commodity futures"
    },
}

# Correlation matrix based on historical data (simplified for demonstration)
# In production, this would be calculated from actual historical returns
CORRELATION_MATRIX = {
    # Bonds have low/negative correlation with stocks
    ("BND", "VOO"): 0.05, ("BND", "QQQ"): -0.05, ("BND", "VTI"): 0.05,
    ("TLT", "VOO"): -0.30, ("TLT", "QQQ"): -0.35, ("TLT", "VTI"): -0.30,

    # Stocks are highly correlated with each other
    ("VOO", "QQQ"): 0.85, ("VOO", "VTI"): 0.99, ("VOO", "VXUS"): 0.70,
    ("QQQ", "VTI"): 0.88, ("QQQ", "ARKK"): 0.80,

    # Alternatives have varied correlations
    ("GLD", "VOO"): 0.05, ("GLD", "BND"): 0.25,
    ("VNQ", "VOO"): 0.70, ("VNQ", "BND"): 0.20,
    ("BITO", "VOO"): 0.40, ("BITO", "QQQ"): 0.50,

    # Bonds correlated with each other
    ("BND", "TLT"): 0.85, ("BND", "TIP"): 0.80, ("BND", "SHY"): 0.70,
    ("BND", "HYG"): 0.60,
}

# Risk-free rate assumption (Treasury yield)
RISK_FREE_RATE = 0.045  # 4.5% (current T-bill rate approximation)


class PortfolioOptimizer:
    """
    Portfolio optimizer implementing:
    1. Hierarchical Risk Parity (HRP) - Lopez de Prado's method
    2. Modified Markowitz Mean-Variance Optimization

    Focuses on risk minimization for student investors.
    """

    def __init__(self, gemini_api_key: str = None):
        self.etf_universe = ETF_UNIVERSE
        self.risk_free_rate = RISK_FREE_RATE
        self.gemini_api_key = gemini_api_key

        # Build covariance and correlation matrices
        self._build_matrices()

    def _build_matrices(self):
        """Build covariance and correlation matrices from ETF data"""
        tickers = list(self.etf_universe.keys())
        n = len(tickers)

        # Initialize correlation matrix with 1s on diagonal
        self.corr_matrix = pd.DataFrame(
            np.eye(n), index=tickers, columns=tickers
        )

        # Fill in known correlations (symmetric)
        for (t1, t2), corr in CORRELATION_MATRIX.items():
            if t1 in tickers and t2 in tickers:
                self.corr_matrix.loc[t1, t2] = corr
                self.corr_matrix.loc[t2, t1] = corr

        # Fill remaining with moderate positive correlations based on category
        for i, t1 in enumerate(tickers):
            for j, t2 in enumerate(tickers):
                if i != j and self.corr_matrix.loc[t1, t2] == 0:
                    cat1 = self.etf_universe[t1]["category"]
                    cat2 = self.etf_universe[t2]["category"]

                    if cat1 == cat2:
                        # Same category: higher correlation
                        self.corr_matrix.loc[t1, t2] = 0.60
                    else:
                        # Different category: lower correlation
                        self.corr_matrix.loc[t1, t2] = 0.20

                    self.corr_matrix.loc[t2, t1] = self.corr_matrix.loc[t1, t2]

        # Build volatility vector
        self.volatilities = pd.Series({
            ticker: data["volatility"]
            for ticker, data in self.etf_universe.items()
        })

        # Build covariance matrix: Cov(i,j) = Corr(i,j) * Vol(i) * Vol(j)
        self.cov_matrix = self.corr_matrix.copy()
        for t1 in tickers:
            for t2 in tickers:
                self.cov_matrix.loc[t1, t2] = (
                    self.corr_matrix.loc[t1, t2] *
                    self.volatilities[t1] *
                    self.volatilities[t2]
                )

        # Build expected returns series
        self.expected_returns = pd.Series({
            ticker: data["expected_return"]
            for ticker, data in self.etf_universe.items()
        })

    def get_personalized_constraints(self, risk_score: float, assessment_data: dict = None) -> Dict:
        """
        Generate personalized portfolio constraints based on individual assessment answers.
        Each user gets unique constraints derived from their specific responses.

        This creates a continuous spectrum of portfolios rather than discrete categories.
        """
        if not assessment_data:
            # Fallback to risk-score based constraints
            return self._get_default_constraints(risk_score)

        # Extract key factors from assessment (all on 1-10 scale)
        # Higher values = more aggressive/comfortable with risk

        # Risk capacity factors (objective)
        age_factor = assessment_data.get("age_group", 5) / 10  # Younger = higher
        horizon_factor = assessment_data.get("investment_horizon", 5) / 10  # Longer = higher
        income_stability = assessment_data.get("income_stability", 5) / 10
        emergency_fund = assessment_data.get("emergency_fund", 5) / 10

        # Risk tolerance factors (behavioral)
        volatility_tolerance = assessment_data.get("reaction_to_volatility", 5) / 10
        uncertainty_comfort = assessment_data.get("comfort_with_uncertainty", 5) / 10
        risk_reward_pref = assessment_data.get("risk_reward_preference", 5) / 10
        drawdown_tolerance = assessment_data.get("max_drawdown_tolerance", 5) / 10
        loss_aversion = 1 - (assessment_data.get("loss_aversion", 5) / 10)  # Invert: low aversion = aggressive

        # Investment style factors
        primary_goal = assessment_data.get("primary_goal", 5) / 10  # Growth vs preservation
        diversification_pref = assessment_data.get("diversification_importance", 5) / 10

        # Thematic preferences
        crypto_comfort = assessment_data.get("crypto_comfort", 1) / 10
        alt_assets_interest = assessment_data.get("alternative_assets_interest", 5) / 10
        tech_belief = assessment_data.get("tech_disruption_belief", 5) / 10

        # Financial literacy (affects concentration limits)
        financial_knowledge = assessment_data.get("financial_knowledge", 5) / 10
        decision_confidence = assessment_data.get("decision_confidence", 5) / 10

        # Calculate personalized allocations using weighted factors

        # Stock allocation: based on risk capacity + tolerance + goals
        # Range: 15% (very conservative) to 95% (very aggressive)
        risk_capacity = (age_factor * 0.3 + horizon_factor * 0.4 + income_stability * 0.15 + emergency_fund * 0.15)
        risk_tolerance = (volatility_tolerance * 0.25 + uncertainty_comfort * 0.2 +
                         risk_reward_pref * 0.25 + drawdown_tolerance * 0.15 + loss_aversion * 0.15)
        growth_orientation = primary_goal * 0.6 + tech_belief * 0.4

        stock_factor = (risk_capacity * 0.4 + risk_tolerance * 0.35 + growth_orientation * 0.25)
        max_stocks = 0.15 + (stock_factor * 0.80)  # 15% to 95%

        # Bond allocation: inverse of stock allocation with floor
        # Range: 5% to 70%
        min_bonds = max(0.05, 0.70 - (stock_factor * 0.65))  # More aggressive = less bonds

        # Alternative allocation: based on alt interest + diversification preference
        # Range: 5% to 35%
        alt_factor = (alt_assets_interest * 0.6 + diversification_pref * 0.2 + risk_tolerance * 0.2)
        max_alts = 0.05 + (alt_factor * 0.30)

        # Crypto allocation: directly tied to crypto comfort
        # Range: 0% to 15%
        max_crypto = crypto_comfort * 0.15

        # Single ETF concentration: based on diversification preference and knowledge
        # Range: 15% to 40%
        concentration_factor = (1 - diversification_pref) * 0.5 + financial_knowledge * 0.5
        max_single_etf = 0.15 + (concentration_factor * 0.25)

        # Target volatility: based on overall risk tolerance
        # Range: 6% to 28%
        vol_factor = (risk_tolerance * 0.6 + risk_capacity * 0.4)
        target_volatility = 0.06 + (vol_factor * 0.22)
        max_volatility = target_volatility * 1.3

        return {
            "max_stock_allocation": round(min(0.95, max_stocks), 3),
            "min_bond_allocation": round(max(0.05, min_bonds), 3),
            "max_alternative_allocation": round(min(0.35, max_alts), 3),
            "max_single_etf": round(min(0.40, max_single_etf), 3),
            "max_crypto": round(min(0.15, max_crypto), 3),
            "target_volatility": round(target_volatility, 3),
            "max_volatility": round(max_volatility, 3),
            # Pass through preferences for ETF selection
            "tech_preference": tech_belief,
            "dividend_preference": 1 - growth_orientation,  # Income vs growth
            "international_preference": assessment_data.get("diversification_importance", 5) / 10,
        }

    def _get_default_constraints(self, risk_score: float) -> Dict:
        """Fallback constraints based on risk score only"""
        # Continuous interpolation based on risk score (1-10)
        t = (risk_score - 1) / 9  # Normalize to 0-1

        return {
            "max_stock_allocation": 0.20 + (t * 0.75),  # 20% to 95%
            "min_bond_allocation": 0.60 - (t * 0.55),   # 60% to 5%
            "max_alternative_allocation": 0.10 + (t * 0.25),  # 10% to 35%
            "max_single_etf": 0.20 + (t * 0.15),  # 20% to 35%
            "max_crypto": t * 0.15,  # 0% to 15%
            "target_volatility": 0.06 + (t * 0.20),  # 6% to 26%
            "max_volatility": 0.08 + (t * 0.25),  # 8% to 33%
        }

    def filter_etfs_by_risk(self, max_risk_level: int, assessment_data: dict = None) -> List[str]:
        """Filter ETFs based on maximum acceptable risk level and user preferences"""
        eligible_etfs = []

        for ticker, data in self.etf_universe.items():
            if data["risk_level"] <= max_risk_level:
                eligible_etfs.append(ticker)

        # If user has specific preferences, adjust
        if assessment_data:
            crypto_comfort = assessment_data.get("crypto_comfort", 1)
            if crypto_comfort < 3 and "BITO" in eligible_etfs:
                eligible_etfs.remove("BITO")

        return eligible_etfs

    def get_etf_preference_scores(self, assessment_data: dict) -> Dict[str, float]:
        """
        Score each ETF based on how well it matches user preferences.
        Higher score = better match for this user.
        Creates differentiation between ETFs based on user's specific answers.
        """
        if not assessment_data:
            return {ticker: 1.0 for ticker in self.etf_universe}

        scores = {}

        # User preferences (normalized 0-1)
        tech_pref = assessment_data.get("tech_disruption_belief", 5) / 10
        income_pref = 1 - (assessment_data.get("primary_goal", 5) / 10)  # Lower goal = income focused
        growth_pref = assessment_data.get("primary_goal", 5) / 10
        intl_pref = assessment_data.get("diversification_importance", 5) / 10
        alt_pref = assessment_data.get("alternative_assets_interest", 5) / 10
        crypto_pref = assessment_data.get("crypto_comfort", 1) / 10
        risk_tolerance = assessment_data.get("reaction_to_volatility", 5) / 10

        for ticker, data in self.etf_universe.items():
            score = 1.0  # Base score

            # Tech preference: boost or reduce tech ETFs
            if ticker in ["QQQ", "ARKK"]:
                score += (tech_pref - 0.5) * 1.0  # Range: -0.5 to +0.5

            # Dividend/income preference
            if ticker in ["SCHD", "VTV", "XLU"]:
                score += (income_pref - 0.5) * 0.8

            # Growth preference
            if ticker in ["VOO", "VTI", "QQQ", "VWO"]:
                score += (growth_pref - 0.5) * 0.6

            # International diversification preference
            if ticker in ["VXUS", "VWO"]:
                score += (intl_pref - 0.5) * 0.8

            # Alternative assets preference
            if data["category"] == "alternatives" and ticker != "BITO":
                score += (alt_pref - 0.5) * 0.6

            # Crypto preference - stronger effect
            if ticker == "BITO":
                score += (crypto_pref - 0.3) * 1.5  # Penalize if low comfort

            # Risk tolerance affects volatile assets
            if data["risk_level"] >= 7:  # High risk ETFs
                score += (risk_tolerance - 0.5) * 0.5
            elif data["risk_level"] <= 2:  # Low risk ETFs (safe bonds)
                score += (0.5 - risk_tolerance) * 0.4  # Boost for conservative users

            # Ensure minimum score
            scores[ticker] = round(max(0.3, score), 3)

        return scores

    def optimize_hrp(self, eligible_tickers: List[str]) -> Dict[str, float]:
        """
        Hierarchical Risk Parity (HRP) Optimization

        Based on Lopez de Prado (2016): "Building Diversified Portfolios
        that Outperform Out-of-Sample"

        HRP uses hierarchical clustering to group similar assets and allocates
        risk equally across clusters, avoiding unstable covariance matrix inversion.

        Steps:
        1. Tree Clustering: Hierarchical clustering of assets based on correlation
        2. Quasi-Diagonalization: Reorganize covariance matrix
        3. Recursive Bisection: Allocate weights using inverse variance
        """
        if len(eligible_tickers) < 2:
            # Single asset case
            return {eligible_tickers[0]: 1.0} if eligible_tickers else {}

        try:
            # Get subset of covariance matrix for eligible tickers
            cov_subset = self.cov_matrix.loc[eligible_tickers, eligible_tickers]

            # Use PyPortfolioOpt's HRP implementation
            hrp = HRPOpt(cov_subset)
            weights = hrp.optimize()

            # Clean weights (remove very small allocations)
            cleaned_weights = {
                ticker: weight
                for ticker, weight in weights.items()
                if weight > 0.01
            }

            # Normalize
            total = sum(cleaned_weights.values())
            if total > 0:
                cleaned_weights = {k: v/total for k, v in cleaned_weights.items()}

            logger.info(f"HRP optimization successful: {len(cleaned_weights)} assets")
            return cleaned_weights

        except Exception as e:
            logger.error(f"HRP optimization failed: {e}")
            # Fallback to equal weight
            return {ticker: 1.0/len(eligible_tickers) for ticker in eligible_tickers}

    def optimize_markowitz(
        self,
        eligible_tickers: List[str],
        constraints: Dict,
        objective: str = "max_sharpe"
    ) -> Dict[str, float]:
        """
        Modified Markowitz Mean-Variance Optimization

        Based on Markowitz (1952): "Portfolio Selection"

        Optimizes for:
        - Maximum Sharpe ratio (best risk-adjusted return)
        - Efficient risk (target volatility)
        - Efficient return (target return with min risk)

        With constraints:
        - Maximum allocation per asset
        - Sector/category limits
        - Crypto exposure limits
        """
        if len(eligible_tickers) < 2:
            return {eligible_tickers[0]: 1.0} if eligible_tickers else {}

        try:
            # Get subsets for eligible tickers
            mu = self.expected_returns[eligible_tickers]
            cov = self.cov_matrix.loc[eligible_tickers, eligible_tickers]

            # Create efficient frontier optimizer
            ef = EfficientFrontier(mu, cov)

            # Add position size constraints
            max_weight = constraints.get("max_single_etf", 0.25)
            ef.add_constraint(lambda w: w <= max_weight)
            ef.add_constraint(lambda w: w >= 0.0)

            # Optimize based on objective
            if objective == "min_volatility":
                weights = ef.min_volatility()
            elif objective == "max_sharpe":
                weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)
            elif objective == "efficient_risk":
                target_vol = constraints.get("target_volatility", 0.12)
                try:
                    weights = ef.efficient_risk(target_volatility=target_vol)
                except Exception:
                    # If target volatility not achievable, try efficient_return
                    # Target a reasonable return based on max volatility allowed
                    max_vol = constraints.get("max_volatility", 0.15)
                    # Estimate achievable return: higher vol = higher potential return
                    target_return = 0.05 + (max_vol * 0.4)  # e.g., 15% vol -> 11% return target
                    try:
                        ef2 = EfficientFrontier(mu, cov)
                        ef2.add_constraint(lambda w: w <= max_weight)
                        weights = ef2.efficient_return(target_return=target_return)
                    except Exception:
                        # Final fallback: max quadratic utility (balances return vs risk)
                        ef3 = EfficientFrontier(mu, cov)
                        ef3.add_constraint(lambda w: w <= max_weight)
                        # Risk aversion: lower = more aggressive (prefer returns over risk reduction)
                        risk_aversion = 1.0  # Balanced approach
                        weights = ef3.max_quadratic_utility(risk_aversion=risk_aversion)
            else:
                weights = ef.max_sharpe(risk_free_rate=self.risk_free_rate)

            # Clean weights
            cleaned_weights = ef.clean_weights(cutoff=0.01)

            logger.info(f"Markowitz optimization successful: {len(cleaned_weights)} assets")
            return dict(cleaned_weights)

        except Exception as e:
            logger.error(f"Markowitz optimization failed: {e}")
            # Fallback to return-weighted allocation
            return self._fallback_return_weighted(eligible_tickers)

    def _fallback_return_weighted(self, tickers: List[str]) -> Dict[str, float]:
        """Fallback allocation weighted by expected return"""
        total_return = sum(self.expected_returns[t] for t in tickers)
        if total_return > 0:
            weights = {t: self.expected_returns[t] / total_return for t in tickers}
        else:
            weights = {t: 1.0 / len(tickers) for t in tickers}
        return weights

    def apply_category_constraints(
        self,
        weights: Dict[str, float],
        constraints: Dict
    ) -> Dict[str, float]:
        """
        Apply category-level constraints to portfolio weights.
        Ensures minimum bond allocation, maximum stock allocation, etc.
        Redistributes excess to maximize returns while respecting constraints.
        """
        adjusted_weights = weights.copy()

        # Get constraints
        min_bonds = constraints.get("min_bond_allocation", 0.20)
        max_stocks = constraints.get("max_stock_allocation", 0.60)
        max_alts = constraints.get("max_alternative_allocation", 0.20)
        max_crypto = constraints.get("max_crypto", 0.05)

        # Get stock tickers for redistribution (prefer stocks over bonds for returns)
        stock_tickers = [t for t in adjusted_weights if self.etf_universe.get(t, {}).get("category") == "stocks"]
        bond_tickers = [t for t in adjusted_weights if self.etf_universe.get(t, {}).get("category") == "bonds"]

        # Limit crypto specifically first - redistribute to stocks for better returns
        if "BITO" in adjusted_weights:
            if adjusted_weights["BITO"] > max_crypto:
                excess = adjusted_weights["BITO"] - max_crypto
                adjusted_weights["BITO"] = max_crypto
                # Redistribute excess to stocks (higher return potential)
                if stock_tickers:
                    for st in stock_tickers:
                        adjusted_weights[st] = adjusted_weights.get(st, 0) + excess / len(stock_tickers)
                elif bond_tickers:
                    for bt in bond_tickers:
                        adjusted_weights[bt] = adjusted_weights.get(bt, 0) + excess / len(bond_tickers)

        # Calculate current category allocations
        category_weights = {"bonds": 0, "stocks": 0, "alternatives": 0}
        for ticker, weight in adjusted_weights.items():
            if ticker in self.etf_universe:
                category = self.etf_universe[ticker]["category"]
                category_weights[category] += weight

        # If alternatives (excluding already-capped crypto) exceed maximum, redistribute to stocks
        if category_weights["alternatives"] > max_alts:
            excess_alts = category_weights["alternatives"] - max_alts
            alt_scale = max_alts / category_weights["alternatives"]

            # Scale down alternatives
            for ticker in adjusted_weights:
                if self.etf_universe[ticker]["category"] == "alternatives":
                    adjusted_weights[ticker] *= alt_scale

            # Redistribute excess to stocks for better returns
            stock_tickers = [t for t in adjusted_weights if self.etf_universe.get(t, {}).get("category") == "stocks"]
            if stock_tickers:
                for st in stock_tickers:
                    adjusted_weights[st] = adjusted_weights.get(st, 0) + excess_alts / len(stock_tickers)

        # Recalculate category weights
        category_weights = {"bonds": 0, "stocks": 0, "alternatives": 0}
        for ticker, weight in adjusted_weights.items():
            if ticker in self.etf_universe:
                category = self.etf_universe[ticker]["category"]
                category_weights[category] += weight

        # If stocks exceed maximum, scale down stocks and redistribute to bonds
        if category_weights["stocks"] > max_stocks:
            excess_stocks = category_weights["stocks"] - max_stocks
            stock_scale = max_stocks / category_weights["stocks"]

            for ticker in adjusted_weights:
                if self.etf_universe[ticker]["category"] == "stocks":
                    adjusted_weights[ticker] *= stock_scale

            bond_tickers = [t for t in adjusted_weights if self.etf_universe.get(t, {}).get("category") == "bonds"]
            if bond_tickers:
                for bt in bond_tickers:
                    adjusted_weights[bt] = adjusted_weights.get(bt, 0) + excess_stocks / len(bond_tickers)

        # Recalculate after adjustments
        category_weights = {"bonds": 0, "stocks": 0, "alternatives": 0}
        for ticker, weight in adjusted_weights.items():
            if ticker in self.etf_universe:
                category = self.etf_universe[ticker]["category"]
                category_weights[category] += weight

        # If bonds are under minimum, scale up bonds and scale down others proportionally
        if category_weights["bonds"] < min_bonds and category_weights["bonds"] > 0:
            needed_bonds = min_bonds - category_weights["bonds"]
            other_total = category_weights["stocks"] + category_weights["alternatives"]

            if other_total > 0:
                reduction_factor = needed_bonds / other_total

                for ticker in adjusted_weights:
                    cat = self.etf_universe[ticker]["category"]
                    if cat == "bonds":
                        adjusted_weights[ticker] *= (min_bonds / category_weights["bonds"])
                    else:
                        adjusted_weights[ticker] *= (1 - reduction_factor)

        # Normalize to sum to 1
        total = sum(adjusted_weights.values())
        if total > 0:
            adjusted_weights = {k: v/total for k, v in adjusted_weights.items()}

        return adjusted_weights

    def optimize_portfolio(
        self,
        risk_score: float,
        risk_profile: str,
        assessment_data: dict = None,
        method: OptimizationMethod = OptimizationMethod.HYBRID
    ) -> Dict:
        """
        Main optimization function combining HRP and Markowitz.
        Creates a UNIQUE portfolio for each user based on their assessment answers.

        For HYBRID method:
        - Uses HRP for diversification structure
        - Uses Markowitz for return optimization
        - Applies personalized constraints from assessment data
        - Weights ETFs by user preference scores
        """
        # Get PERSONALIZED constraints from assessment data (not fixed categories)
        constraints = self.get_personalized_constraints(risk_score, assessment_data)

        # Get ETF preference scores based on user's answers
        preference_scores = self.get_etf_preference_scores(assessment_data) if assessment_data else {}

        # Determine max ETF risk level based on user's risk score
        max_etf_risk = min(10, int(risk_score * 1.2) + 2)
        eligible_etfs = self.filter_etfs_by_risk(max_etf_risk, assessment_data)

        if not eligible_etfs:
            eligible_etfs = ["BND", "VOO", "GLD"]  # Fallback

        logger.info(f"Optimizing personalized portfolio (score: {risk_score})")
        logger.info(f"Personalized constraints: {constraints}")
        logger.info(f"Method: {method}")

        if method == OptimizationMethod.HRP:
            # Pure HRP
            allocations = self.optimize_hrp(eligible_etfs)
            allocations = self.apply_category_constraints(allocations, constraints)
            optimization_method = "Hierarchical Risk Parity (HRP)"

        elif method == OptimizationMethod.MARKOWITZ:
            # Pure Markowitz with minimum volatility objective
            allocations = self.optimize_markowitz(
                eligible_etfs,
                constraints,
                objective="min_volatility"
            )
            allocations = self.apply_category_constraints(allocations, constraints)
            optimization_method = "Modified Markowitz Mean-Variance"

        else:  # HYBRID
            # Get allocations from both methods
            hrp_weights = self.optimize_hrp(eligible_etfs)

            # Use efficient_risk to target user's personalized volatility level
            markowitz_weights = self.optimize_markowitz(
                eligible_etfs,
                constraints,
                objective="efficient_risk"
            )

            # Dynamic blend based on risk score:
            # - Conservative (low score): More HRP for safety
            # - Aggressive (high score): More Markowitz for returns
            # α₀ = 0.4 determined via grid search on 2017-2018 validation data
            hrp_weight = max(0.1, 0.4 - (risk_score * 0.04))
            mkw_weight = 1.0 - hrp_weight

            all_tickers = set(hrp_weights.keys()) | set(markowitz_weights.keys())
            allocations = {}

            for ticker in all_tickers:
                hrp_w = hrp_weights.get(ticker, 0)
                mkw_w = markowitz_weights.get(ticker, 0)
                base_weight = hrp_weight * hrp_w + mkw_weight * mkw_w

                # Apply user preference score to personalize allocation
                pref_score = preference_scores.get(ticker, 1.0)
                allocations[ticker] = base_weight * pref_score

            # Normalize
            total = sum(allocations.values())
            if total > 0:
                allocations = {k: v/total for k, v in allocations.items()}

            allocations = self.apply_category_constraints(allocations, constraints)
            optimization_method = f"Personalized Hybrid ({int(hrp_weight*100)}% HRP + {int(mkw_weight*100)}% Markowitz)"

        # Remove zero allocations
        allocations = {k: v for k, v in allocations.items() if v > 0.005}

        # Normalize final weights
        total = sum(allocations.values())
        if total > 0:
            allocations = {k: round(v/total, 4) for k, v in allocations.items()}

        # Calculate portfolio metrics
        portfolio_metrics = self._calculate_portfolio_metrics(allocations)
        portfolio_metrics["optimization_method"] = optimization_method

        return {
            "allocations": allocations,
            "metrics": portfolio_metrics,
            "risk_profile": risk_profile,
            "risk_score": risk_score,
            "constraints_used": constraints,
            "eligible_etfs": eligible_etfs
        }

    def _calculate_portfolio_metrics(self, allocations: Dict) -> Dict:
        """Calculate expected return, volatility, and Sharpe ratio for portfolio"""
        if not allocations:
            return {
                "expected_return": 0,
                "expected_volatility": 0,
                "sharpe_ratio": 0,
                "category_breakdown": {}
            }

        tickers = list(allocations.keys())
        weights = np.array([allocations[t] for t in tickers])

        # Expected return: weighted sum
        returns = np.array([self.expected_returns[t] for t in tickers])
        expected_return = np.dot(weights, returns)

        # Portfolio volatility: sqrt(w' * Cov * w)
        cov_subset = self.cov_matrix.loc[tickers, tickers].values
        portfolio_variance = np.dot(weights.T, np.dot(cov_subset, weights))
        expected_volatility = np.sqrt(portfolio_variance)

        # Sharpe ratio
        sharpe_ratio = (expected_return - self.risk_free_rate) / expected_volatility if expected_volatility > 0 else 0

        # Category breakdown
        category_breakdown = {"bonds": 0, "stocks": 0, "alternatives": 0}
        for ticker, weight in allocations.items():
            if ticker in self.etf_universe:
                category = self.etf_universe[ticker]["category"]
                category_breakdown[category] += weight

        return {
            "expected_return": round(expected_return, 4),
            "expected_volatility": round(expected_volatility, 4),
            "sharpe_ratio": round(sharpe_ratio, 4),
            "category_breakdown": {k: round(v, 4) for k, v in category_breakdown.items()}
        }

    def calculate_sharpe_ratio(self, expected_return: float, volatility: float) -> float:
        """Calculate Sharpe ratio for a given return and volatility"""
        if volatility == 0:
            return 0
        return (expected_return - self.risk_free_rate) / volatility

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
Primary Goal: {assessment_summary.get('primary_goal', 'Long-term growth')}

Portfolio Allocation:
{allocation_text}

This portfolio was optimized using a hybrid approach combining:
1. Hierarchical Risk Parity (HRP) - for robust diversification
2. Markowitz Mean-Variance Optimization - for risk minimization

Please provide:
1. A 2-3 sentence explanation of why this allocation suits their risk profile
2. One key benefit of this portfolio for a student investor
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
    gemini_api_key: str = None,
    method: str = "hybrid"
) -> Dict:
    """
    Convenience function to get portfolio allocation.

    Args:
        risk_score: User's risk score (1-10)
        risk_profile: Risk profile string (e.g., "Conservative", "Moderate")
        assessment_data: Optional dict of all assessment answers
        gemini_api_key: Optional Gemini API key for AI recommendations
        method: Optimization method - "hrp", "markowitz", or "hybrid"

    Returns:
        Dict containing allocations and portfolio metrics
    """
    optimizer = PortfolioOptimizer(gemini_api_key=gemini_api_key)

    opt_method = OptimizationMethod.HYBRID
    if method == "hrp":
        opt_method = OptimizationMethod.HRP
    elif method == "markowitz":
        opt_method = OptimizationMethod.MARKOWITZ

    return optimizer.optimize_portfolio(
        risk_score,
        risk_profile,
        assessment_data,
        method=opt_method
    )
