"""
Coefficient Analysis Script
1. Grid search for optimal α₀ (HRP base weight)
2. Bootstrap resampling for confidence intervals
"""

import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.services.portfolio_optimizer import PortfolioOptimizer, OptimizationMethod

# ETFs for backtesting (same as real_backtest.py)
BACKTEST_ETFS = [
    'VOO', 'VTI', 'QQQ', 'SCHD', 'VTV', 'VWO', 'VXUS', 'XLU',  # Stocks
    'BND', 'TLT', 'TIP',  # Bonds
    'GLD', 'VNQ',  # Alternatives
]

BENCHMARK = 'SPY'

# Validation period for grid search (2017-2018)
VALIDATION_START = '2017-01-01'
VALIDATION_END = '2018-12-31'

# Test period (2019-2024)
TEST_START = '2019-01-01'
TEST_END = '2024-12-01'


def download_data(start, end):
    """Download historical price data"""
    print(f"Downloading data from {start} to {end}...")
    all_tickers = BACKTEST_ETFS + [BENCHMARK]
    data = yf.download(all_tickers, start=start, end=end, progress=False, auto_adjust=True)

    if 'Close' in data.columns.get_level_values(0):
        data = data['Close']
    elif isinstance(data.columns, pd.MultiIndex):
        data = data.droplevel(0, axis=1) if data.columns.nlevels > 1 else data

    return data


def calculate_metrics(returns):
    """Calculate performance metrics"""
    annual_return = returns.mean() * 252
    annual_vol = returns.std() * np.sqrt(252)
    sharpe = annual_return / annual_vol if annual_vol > 0 else 0

    cumulative = (1 + returns).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()

    return {
        'annual_return': annual_return,
        'annual_volatility': annual_vol,
        'sharpe_ratio': sharpe,
        'max_drawdown': max_drawdown
    }


def get_portfolio_weights_with_alpha(optimizer, alpha_0, risk_score=6.5):
    """Get portfolio weights with custom alpha_0"""
    # Moderate assessment
    assessment_data = {
        'age_group': 7,
        'investment_horizon': 8,
        'income_stability': 6,
        'emergency_fund': 7,
        'reaction_to_volatility': 6,
        'comfort_with_uncertainty': 6,
        'risk_reward_preference': 7,
        'max_drawdown_tolerance': 6,
        'loss_aversion': 4,
        'primary_goal': 7,
        'diversification_importance': 8,
        'crypto_comfort': 1,
        'alternative_assets_interest': 6,
        'tech_disruption_belief': 6,
        'financial_knowledge': 7,
        'decision_confidence': 6,
    }

    # Get constraints
    constraints = optimizer.get_personalized_constraints(risk_score, assessment_data)

    # Get eligible ETFs
    max_etf_risk = min(10, int(risk_score * 1.2) + 2)
    eligible_etfs = optimizer.filter_etfs_by_risk(max_etf_risk, assessment_data)
    eligible_etfs = [e for e in eligible_etfs if e in BACKTEST_ETFS]

    if not eligible_etfs:
        eligible_etfs = ["BND", "VOO", "GLD"]

    # Get HRP and Markowitz weights
    hrp_weights = optimizer.optimize_hrp(eligible_etfs)
    markowitz_weights = optimizer.optimize_markowitz(eligible_etfs, constraints, objective="efficient_risk")

    # Custom blending with specified alpha_0
    hrp_weight = max(0.1, alpha_0 - (risk_score * 0.06))
    mkw_weight = 1.0 - hrp_weight

    all_tickers = set(hrp_weights.keys()) | set(markowitz_weights.keys())
    allocations = {}

    for ticker in all_tickers:
        hrp_w = hrp_weights.get(ticker, 0)
        mkw_w = markowitz_weights.get(ticker, 0)
        allocations[ticker] = hrp_weight * hrp_w + mkw_weight * mkw_w

    # Normalize
    total = sum(allocations.values())
    if total > 0:
        allocations = {k: v/total for k, v in allocations.items()}

    # Apply constraints
    allocations = optimizer.apply_category_constraints(allocations, constraints)

    return allocations


def run_grid_search():
    """Run grid search on validation data to find optimal α₀"""
    print("\n" + "="*60)
    print("GRID SEARCH FOR OPTIMAL α₀ (VALIDATION PERIOD: 2017-2018)")
    print("="*60)

    # Download validation data
    prices = download_data(VALIDATION_START, VALIDATION_END)
    returns = prices.pct_change().dropna()

    optimizer = PortfolioOptimizer()

    alpha_values = [0.40, 0.50, 0.60, 0.70, 0.80]
    results = []

    for alpha_0 in alpha_values:
        print(f"\nTesting α₀ = {alpha_0}...")

        # Get weights with this alpha
        weights = get_portfolio_weights_with_alpha(optimizer, alpha_0)

        # Filter for available ETFs
        filtered_weights = {k: v for k, v in weights.items() if k in returns.columns}
        total = sum(filtered_weights.values())
        if total > 0:
            filtered_weights = {k: v/total for k, v in filtered_weights.items()}

        # Calculate portfolio returns
        weight_array = np.array([filtered_weights.get(c, 0) for c in BACKTEST_ETFS if c in returns.columns])
        etf_returns = returns[[c for c in BACKTEST_ETFS if c in returns.columns]]
        portfolio_returns = (etf_returns * weight_array).sum(axis=1)

        # Calculate metrics
        metrics = calculate_metrics(portfolio_returns)
        metrics['alpha_0'] = alpha_0
        results.append(metrics)

        print(f"  Sharpe: {metrics['sharpe_ratio']:.3f}, Max DD: {metrics['max_drawdown']*100:.1f}%, Vol: {metrics['annual_volatility']*100:.1f}%")

    # Find best alpha
    results_df = pd.DataFrame(results)
    best_idx = results_df['sharpe_ratio'].idxmax()
    best_alpha = results_df.loc[best_idx, 'alpha_0']

    print("\n" + "-"*60)
    print("GRID SEARCH RESULTS TABLE (for LaTeX):")
    print("-"*60)
    print(f"{'α₀':<8} {'Sharpe':<12} {'Max DD':<12} {'Volatility':<12} {'Selected'}")
    print("-"*60)
    for _, row in results_df.iterrows():
        selected = "✓" if row['alpha_0'] == best_alpha else ""
        print(f"{row['alpha_0']:<8.2f} {row['sharpe_ratio']:<12.2f} {row['max_drawdown']*100:<12.1f}% {row['annual_volatility']*100:<12.1f}% {selected}")

    print(f"\nOptimal α₀ = {best_alpha}")

    return results_df, best_alpha


def run_bootstrap_analysis(n_bootstrap=1000):
    """Run bootstrap resampling on test data for confidence intervals"""
    print("\n" + "="*60)
    print(f"BOOTSTRAP ANALYSIS (n={n_bootstrap}, TEST PERIOD: 2019-2024)")
    print("="*60)

    # Download test data
    prices = download_data(TEST_START, TEST_END)
    returns = prices.pct_change().dropna()

    optimizer = PortfolioOptimizer()

    # Get hybrid portfolio weights (using optimal α₀ = 0.6)
    weights = get_portfolio_weights_with_alpha(optimizer, 0.6)

    # Filter for available ETFs
    filtered_weights = {k: v for k, v in weights.items() if k in returns.columns}
    total = sum(filtered_weights.values())
    if total > 0:
        filtered_weights = {k: v/total for k, v in filtered_weights.items()}

    # Calculate full period portfolio returns
    weight_array = np.array([filtered_weights.get(c, 0) for c in BACKTEST_ETFS if c in returns.columns])
    etf_returns = returns[[c for c in BACKTEST_ETFS if c in returns.columns]]
    portfolio_returns = (etf_returns * weight_array).sum(axis=1)
    benchmark_returns = returns[BENCHMARK]

    # Full period metrics (point estimates)
    full_metrics = calculate_metrics(portfolio_returns)
    benchmark_metrics = calculate_metrics(benchmark_returns)

    print(f"\nPoint Estimates (Full Period):")
    print(f"  Hybrid Sharpe: {full_metrics['sharpe_ratio']:.3f}")
    print(f"  Hybrid Max DD: {full_metrics['max_drawdown']*100:.1f}%")
    print(f"  Hybrid Return: {full_metrics['annual_return']*100:.1f}%")
    print(f"  S&P 500 Sharpe: {benchmark_metrics['sharpe_ratio']:.3f}")
    print(f"  S&P 500 Max DD: {benchmark_metrics['max_drawdown']*100:.1f}%")

    # Bootstrap resampling
    print(f"\nRunning {n_bootstrap} bootstrap iterations...")

    sharpe_samples = []
    drawdown_samples = []
    return_samples = []

    n_days = len(portfolio_returns)

    for i in range(n_bootstrap):
        if (i + 1) % 200 == 0:
            print(f"  Completed {i+1}/{n_bootstrap}...")

        # Resample with replacement (block bootstrap - 20 day blocks)
        block_size = 20
        n_blocks = n_days // block_size + 1
        indices = []
        for _ in range(n_blocks):
            start_idx = np.random.randint(0, n_days - block_size)
            indices.extend(range(start_idx, start_idx + block_size))
        indices = indices[:n_days]

        resampled_returns = portfolio_returns.iloc[indices].values
        resampled_series = pd.Series(resampled_returns)

        metrics = calculate_metrics(resampled_series)
        sharpe_samples.append(metrics['sharpe_ratio'])
        drawdown_samples.append(metrics['max_drawdown'])
        return_samples.append(metrics['annual_return'])

    # Calculate 95% confidence intervals
    sharpe_ci = np.percentile(sharpe_samples, [2.5, 97.5])
    drawdown_ci = np.percentile(drawdown_samples, [2.5, 97.5])
    return_ci = np.percentile(return_samples, [2.5, 97.5])

    print("\n" + "-"*60)
    print("BOOTSTRAP 95% CONFIDENCE INTERVALS (for LaTeX):")
    print("-"*60)
    print(f"{'Metric':<25} {'Point Estimate':<18} {'95% CI':<25} {'vs. Benchmark'}")
    print("-"*60)

    # Sharpe ratio
    sharpe_vs = ">" if full_metrics['sharpe_ratio'] > benchmark_metrics['sharpe_ratio'] else "<"
    print(f"{'Hybrid Sharpe Ratio':<25} {full_metrics['sharpe_ratio']:<18.2f} [{sharpe_ci[0]:.2f}, {sharpe_ci[1]:.2f}]{'':<10} {sharpe_vs} S&P 500 ({benchmark_metrics['sharpe_ratio']:.2f})")

    # Max Drawdown
    dd_vs = "<" if full_metrics['max_drawdown'] > benchmark_metrics['max_drawdown'] else ">"
    print(f"{'Max Drawdown':<25} {full_metrics['max_drawdown']*100:<18.1f}% [{drawdown_ci[0]*100:.1f}%, {drawdown_ci[1]*100:.1f}%]{'':<3} {dd_vs} S&P 500 ({benchmark_metrics['max_drawdown']*100:.1f}%)")

    # Annual Return
    ret_vs = "≈" if abs(full_metrics['annual_return'] - benchmark_metrics['annual_return']) < 0.02 else (">" if full_metrics['annual_return'] > benchmark_metrics['annual_return'] else "<")
    print(f"{'Annualized Return':<25} {full_metrics['annual_return']*100:<18.1f}% [{return_ci[0]*100:.1f}%, {return_ci[1]*100:.1f}%]{'':<3} {ret_vs} S&P 500 ({benchmark_metrics['annual_return']*100:.1f}%)")

    return {
        'sharpe': {'point': full_metrics['sharpe_ratio'], 'ci': sharpe_ci},
        'drawdown': {'point': full_metrics['max_drawdown'], 'ci': drawdown_ci},
        'return': {'point': full_metrics['annual_return'], 'ci': return_ci},
        'benchmark': benchmark_metrics
    }


if __name__ == "__main__":
    print("="*60)
    print("COEFFICIENT ANALYSIS FOR PORTFOLIO OPTIMIZATION")
    print("="*60)

    # Run grid search
    grid_results, best_alpha = run_grid_search()

    # Run bootstrap analysis
    bootstrap_results = run_bootstrap_analysis(n_bootstrap=1000)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Optimal α₀ from grid search: {best_alpha}")
    print(f"Sharpe Ratio 95% CI: [{bootstrap_results['sharpe']['ci'][0]:.2f}, {bootstrap_results['sharpe']['ci'][1]:.2f}]")
    print(f"Max Drawdown 95% CI: [{bootstrap_results['drawdown']['ci'][0]*100:.1f}%, {bootstrap_results['drawdown']['ci'][1]*100:.1f}%]")
    print(f"Annual Return 95% CI: [{bootstrap_results['return']['ci'][0]*100:.1f}%, {bootstrap_results['return']['ci'][1]*100:.1f}%]")
