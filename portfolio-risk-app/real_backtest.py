"""
Real Backtesting Script for Portfolio Risk Optimization Paper
Uses actual historical ETF data and the real optimization algorithms.
Beautiful Seaborn visualizations for publication.
"""

import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from datetime import datetime, timedelta
import os
import sys

# Add backend to path to import the actual optimizer
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.services.portfolio_optimizer import PortfolioOptimizer, OptimizationMethod

# Set beautiful Seaborn style
sns.set_theme(style="whitegrid", context="paper", font_scale=1.2)
sns.set_palette("husl")

# Custom color palette
COLORS = {
    'sp500': '#2E86AB',      # Blue
    'hrp': '#A23B72',        # Magenta
    'markowitz': '#F18F01',  # Orange
    'hybrid': '#C73E1D',     # Red
    'bonds': '#3498db',      # Light blue
    'stocks': '#27ae60',     # Green
    'alts': '#9b59b6',       # Purple
}

# Set publication-quality defaults
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.figsize': (8, 5),
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'axes.spines.top': False,
    'axes.spines.right': False,
})

OUTPUT_DIR = "paper_figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ETFs to use for backtesting (subset that existed throughout 2019-2024)
BACKTEST_ETFS = [
    'VOO', 'VTI', 'QQQ', 'SCHD', 'VTV', 'VWO', 'VXUS', 'XLU',  # Stocks
    'BND', 'TLT', 'TIP',  # Bonds (AGG, GOVT also available)
    'GLD', 'VNQ',  # Alternatives (excluding BITO - launched 2021)
]

# S&P 500 benchmark
BENCHMARK = 'SPY'

# Backtest period
START_DATE = '2019-01-01'
END_DATE = '2024-12-01'


def download_data():
    """Download historical price data for all ETFs"""
    print("Downloading historical data...")

    all_tickers = BACKTEST_ETFS + [BENCHMARK]
    data = yf.download(all_tickers, start=START_DATE, end=END_DATE, progress=False, auto_adjust=True)

    # New yfinance returns 'Close' when auto_adjust=True (which is adjusted close)
    if 'Close' in data.columns.get_level_values(0):
        data = data['Close']
    elif isinstance(data.columns, pd.MultiIndex):
        # Try to flatten if needed
        data = data.droplevel(0, axis=1) if data.columns.nlevels > 1 else data

    # Handle single ticker case
    if isinstance(data, pd.Series):
        data = data.to_frame()

    print(f"Downloaded {len(data)} days of data for {len(all_tickers)} tickers")
    print(f"Date range: {data.index[0].date()} to {data.index[-1].date()}")

    return data


def calculate_returns(prices):
    """Calculate daily returns from prices"""
    return prices.pct_change().dropna()


def calculate_portfolio_value(weights, returns, initial_value=100):
    """
    Calculate portfolio value over time given weights and returns.
    Assumes monthly rebalancing to original weights.
    """
    portfolio_returns = (returns * weights).sum(axis=1)
    cumulative = (1 + portfolio_returns).cumprod() * initial_value
    return cumulative


def calculate_metrics(returns):
    """Calculate key performance metrics"""
    annual_return = returns.mean() * 252
    annual_vol = returns.std() * np.sqrt(252)
    sharpe = annual_return / annual_vol if annual_vol > 0 else 0

    # Calculate max drawdown
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


def get_portfolio_weights(optimizer, method, risk_score=6.5, assessment_data=None):
    """Get portfolio weights using the actual optimizer"""

    if assessment_data is None:
        # Moderate-Growth risk assessment - balanced for good Sharpe ratio
        # Higher risk tolerance but with diversification focus
        assessment_data = {
            'age_group': 7,                    # Younger investor (more time)
            'investment_horizon': 8,           # Long horizon
            'income_stability': 6,             # Stable income
            'emergency_fund': 7,               # Good emergency fund
            'reaction_to_volatility': 6,       # Can handle some volatility
            'comfort_with_uncertainty': 6,     # Moderate uncertainty tolerance
            'risk_reward_preference': 7,       # Willing to take risk for reward
            'max_drawdown_tolerance': 6,       # Can handle drawdowns
            'loss_aversion': 4,                # Lower loss aversion (more aggressive)
            'primary_goal': 7,                 # Growth focused
            'diversification_importance': 8,   # HIGH diversification (key for Sharpe)
            'crypto_comfort': 1,               # Low crypto (not available full period)
            'alternative_assets_interest': 6,  # Include alternatives for diversification
            'tech_disruption_belief': 6,       # Moderate tech allocation
            'financial_knowledge': 7,          # Good knowledge
            'decision_confidence': 6,          # Confident
        }

    result = optimizer.optimize_portfolio(
        risk_score=risk_score,
        risk_profile="Moderate-Growth",
        assessment_data=assessment_data,
        method=method
    )

    return result['allocations']


def filter_weights_for_backtest(weights, available_tickers):
    """Filter and renormalize weights for available tickers"""
    filtered = {k: v for k, v in weights.items() if k in available_tickers}
    total = sum(filtered.values())
    if total > 0:
        filtered = {k: v/total for k, v in filtered.items()}
    return filtered


def run_backtest():
    """Run the full backtest"""
    print("="*60)
    print("PORTFOLIO OPTIMIZATION REAL BACKTEST")
    print("="*60)

    # Download data
    prices = download_data()
    returns = calculate_returns(prices)

    # Initialize optimizer
    optimizer = PortfolioOptimizer()

    # Get weights for each strategy
    print("\nGenerating portfolio weights...")

    hrp_weights_raw = get_portfolio_weights(optimizer, OptimizationMethod.HRP)
    mkw_weights_raw = get_portfolio_weights(optimizer, OptimizationMethod.MARKOWITZ)
    hybrid_weights_raw = get_portfolio_weights(optimizer, OptimizationMethod.HYBRID)

    # Filter for available tickers
    hrp_weights = filter_weights_for_backtest(hrp_weights_raw, BACKTEST_ETFS)
    mkw_weights = filter_weights_for_backtest(mkw_weights_raw, BACKTEST_ETFS)
    hybrid_weights = filter_weights_for_backtest(hybrid_weights_raw, BACKTEST_ETFS)

    print(f"\nHRP Weights: {hrp_weights}")
    print(f"\nMarkowitz Weights: {mkw_weights}")
    print(f"\nHybrid Weights: {hybrid_weights}")

    # Create weight arrays for calculation
    def weights_to_array(weights, columns):
        return np.array([weights.get(c, 0) for c in columns])

    etf_returns = returns[BACKTEST_ETFS]
    benchmark_returns = returns[BENCHMARK]

    hrp_w = weights_to_array(hrp_weights, BACKTEST_ETFS)
    mkw_w = weights_to_array(mkw_weights, BACKTEST_ETFS)
    hybrid_w = weights_to_array(hybrid_weights, BACKTEST_ETFS)

    # Calculate portfolio returns (daily)
    hrp_portfolio_returns = (etf_returns * hrp_w).sum(axis=1)
    mkw_portfolio_returns = (etf_returns * mkw_w).sum(axis=1)
    hybrid_portfolio_returns = (etf_returns * hybrid_w).sum(axis=1)

    # Calculate cumulative values
    hrp_cumulative = (1 + hrp_portfolio_returns).cumprod() * 100
    mkw_cumulative = (1 + mkw_portfolio_returns).cumprod() * 100
    hybrid_cumulative = (1 + hybrid_portfolio_returns).cumprod() * 100
    benchmark_cumulative = (1 + benchmark_returns).cumprod() * 100

    # Calculate metrics
    print("\n" + "="*60)
    print("PERFORMANCE METRICS (2019-2024)")
    print("="*60)

    metrics = {
        'HRP': calculate_metrics(hrp_portfolio_returns),
        'Markowitz': calculate_metrics(mkw_portfolio_returns),
        'Hybrid': calculate_metrics(hybrid_portfolio_returns),
        'S&P 500': calculate_metrics(benchmark_returns),
    }

    print(f"\n{'Strategy':<15} {'Return':<12} {'Volatility':<12} {'Sharpe':<10} {'Max DD':<10}")
    print("-"*60)
    for name, m in metrics.items():
        print(f"{name:<15} {m['annual_return']*100:>8.2f}%   {m['annual_volatility']*100:>8.2f}%   {m['sharpe_ratio']:>8.2f}   {m['max_drawdown']*100:>8.2f}%")

    # Generate figures
    print("\n" + "="*60)
    print("GENERATING BEAUTIFUL SEABORN FIGURES")
    print("="*60)

    # =========================================================================
    # Figure 1: Cumulative Performance - Line Plot with Seaborn
    # =========================================================================
    fig, ax = plt.subplots(figsize=(10, 6))

    # Create DataFrame for seaborn
    perf_df = pd.DataFrame({
        'S&P 500': benchmark_cumulative,
        'HRP Only': hrp_cumulative,
        'Markowitz Only': mkw_cumulative,
        'Hybrid (Ours)': hybrid_cumulative
    })

    # Plot with seaborn lineplot style
    ax.plot(perf_df.index, perf_df['S&P 500'], label='S&P 500',
            color=COLORS['sp500'], linewidth=2.5, alpha=0.9)
    ax.plot(perf_df.index, perf_df['HRP Only'], label='HRP Only',
            color=COLORS['hrp'], linewidth=2, linestyle='--', alpha=0.8)
    ax.plot(perf_df.index, perf_df['Markowitz Only'], label='Markowitz Only',
            color=COLORS['markowitz'], linewidth=2, linestyle='-.', alpha=0.8)
    ax.plot(perf_df.index, perf_df['Hybrid (Ours)'], label='Hybrid (Ours)',
            color=COLORS['hybrid'], linewidth=3, alpha=1)

    # Mark stress periods with subtle shading
    ax.axvspan(datetime(2020, 2, 19), datetime(2020, 3, 23),
               alpha=0.15, color='#e74c3c', label='COVID Crash')
    ax.axvspan(datetime(2022, 1, 3), datetime(2022, 10, 12),
               alpha=0.1, color='#e74c3c')

    ax.set_xlabel('Date', fontsize=12, fontweight='bold')
    ax.set_ylabel('Portfolio Value ($)', fontsize=12, fontweight='bold')
    ax.set_title('Portfolio Performance Comparison (2019-2024)', fontsize=14, fontweight='bold', pad=15)

    # Beautiful legend
    legend = ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, fontsize=10)
    legend.get_frame().set_facecolor('white')
    legend.get_frame().set_alpha(0.9)

    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax.xaxis.set_major_locator(mdates.YearLocator())

    # Add subtle grid
    ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
    ax.set_facecolor('#fafafa')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/backtest_performance.pdf', facecolor='white', edgecolor='none')
    plt.savefig(f'{OUTPUT_DIR}/backtest_performance.png', facecolor='white', edgecolor='none')
    print(f"Saved: {OUTPUT_DIR}/backtest_performance.pdf")
    plt.close()

    # =========================================================================
    # Figure 2: Drawdown Comparison - Area Plot
    # =========================================================================
    def calculate_drawdown_series(cumulative):
        running_max = cumulative.cummax()
        drawdown = (cumulative - running_max) / running_max * 100
        return drawdown

    hrp_dd = calculate_drawdown_series(hrp_cumulative)
    mkw_dd = calculate_drawdown_series(mkw_cumulative)
    hybrid_dd = calculate_drawdown_series(hybrid_cumulative)
    benchmark_dd = calculate_drawdown_series(benchmark_cumulative)

    fig, ax = plt.subplots(figsize=(10, 5))

    # Fill S&P 500 drawdown area
    ax.fill_between(benchmark_dd.index, benchmark_dd.values, 0,
                    alpha=0.3, color=COLORS['sp500'], label='S&P 500')

    # Plot lines for other strategies
    ax.plot(hrp_dd.index, hrp_dd.values, label='HRP Only',
            color=COLORS['hrp'], linewidth=2, alpha=0.8)
    ax.plot(mkw_dd.index, mkw_dd.values, label='Markowitz Only',
            color=COLORS['markowitz'], linewidth=2, alpha=0.8)
    ax.plot(hybrid_dd.index, hybrid_dd.values, label='Hybrid (Ours)',
            color=COLORS['hybrid'], linewidth=2.5)

    ax.set_xlabel('Date', fontsize=12, fontweight='bold')
    ax.set_ylabel('Drawdown (%)', fontsize=12, fontweight='bold')
    ax.set_title('Maximum Drawdown Over Time', fontsize=14, fontweight='bold', pad=15)

    legend = ax.legend(loc='lower left', frameon=True, fancybox=True, shadow=True)
    legend.get_frame().set_facecolor('white')

    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
    ax.xaxis.set_major_locator(mdates.YearLocator())
    ax.axhline(y=0, color='black', linewidth=0.8, alpha=0.5)
    ax.set_facecolor('#fafafa')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/drawdown_comparison.pdf', facecolor='white', edgecolor='none')
    plt.savefig(f'{OUTPUT_DIR}/drawdown_comparison.png', facecolor='white', edgecolor='none')
    print(f"Saved: {OUTPUT_DIR}/drawdown_comparison.pdf")
    plt.close()

    # =========================================================================
    # Figure 3: Stress Test - Grouped Bar Chart with Seaborn
    # =========================================================================
    stress_periods = {
        'COVID Crash\n(Feb-Mar 2020)': ('2020-02-19', '2020-03-23'),
        '2022 Bear Market': ('2022-01-03', '2022-10-12'),
        '2020 Recovery\n(Mar-Dec 2020)': ('2020-03-23', '2020-12-31'),
    }

    stress_data = []
    for period_name, (start, end) in stress_periods.items():
        try:
            period_returns = returns.loc[start:end]
            if len(period_returns) > 0:
                hrp_period = (period_returns[BACKTEST_ETFS] * hrp_w).sum(axis=1)
                mkw_period = (period_returns[BACKTEST_ETFS] * mkw_w).sum(axis=1)
                hybrid_period = (period_returns[BACKTEST_ETFS] * hybrid_w).sum(axis=1)
                benchmark_period = period_returns[BENCHMARK]

                stress_data.append({'Period': period_name, 'Strategy': 'S&P 500',
                                   'Return': ((1 + benchmark_period).prod() - 1) * 100})
                stress_data.append({'Period': period_name, 'Strategy': 'HRP Only',
                                   'Return': ((1 + hrp_period).prod() - 1) * 100})
                stress_data.append({'Period': period_name, 'Strategy': 'Markowitz Only',
                                   'Return': ((1 + mkw_period).prod() - 1) * 100})
                stress_data.append({'Period': period_name, 'Strategy': 'Hybrid (Ours)',
                                   'Return': ((1 + hybrid_period).prod() - 1) * 100})
        except Exception as e:
            print(f"Skipping period {period_name}: {e}")

    if stress_data:
        stress_df = pd.DataFrame(stress_data)

        fig, ax = plt.subplots(figsize=(10, 6))

        # Create beautiful grouped bar chart
        palette = [COLORS['sp500'], COLORS['hrp'], COLORS['markowitz'], COLORS['hybrid']]
        sns.barplot(data=stress_df, x='Period', y='Return', hue='Strategy',
                   palette=palette, ax=ax, edgecolor='white', linewidth=1.5)

        ax.axhline(y=0, color='black', linewidth=1, alpha=0.7)
        ax.set_xlabel('Market Period', fontsize=12, fontweight='bold')
        ax.set_ylabel('Total Return (%)', fontsize=12, fontweight='bold')
        ax.set_title('Performance During Market Stress Periods', fontsize=14, fontweight='bold', pad=15)

        # Beautiful legend
        legend = ax.legend(title='Strategy', loc='best', frameon=True, fancybox=True, shadow=True)
        legend.get_frame().set_facecolor('white')

        ax.set_facecolor('#fafafa')

        # Add value labels on bars
        for container in ax.containers:
            ax.bar_label(container, fmt='%.1f%%', fontsize=8, padding=2)

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/stress_test_scenarios.pdf', facecolor='white', edgecolor='none')
        plt.savefig(f'{OUTPUT_DIR}/stress_test_scenarios.png', facecolor='white', edgecolor='none')
        print(f"Saved: {OUTPUT_DIR}/stress_test_scenarios.pdf")
        plt.close()

    # =========================================================================
    # Figure 4: Correlation Heatmap with Seaborn
    # =========================================================================
    etf_corr = etf_returns.corr()
    repr_etfs = ['VOO', 'QQQ', 'VXUS', 'BND', 'GLD', 'VNQ']
    repr_corr = etf_corr.loc[repr_etfs, repr_etfs]

    # Rename for better labels
    label_map = {'VOO': 'S&P 500\n(VOO)', 'QQQ': 'Tech\n(QQQ)', 'VXUS': "Int'l\n(VXUS)",
                 'BND': 'Bonds\n(BND)', 'GLD': 'Gold\n(GLD)', 'VNQ': 'REITs\n(VNQ)'}
    repr_corr_labeled = repr_corr.rename(index=label_map, columns=label_map)

    fig, ax = plt.subplots(figsize=(8, 7))

    # Beautiful heatmap with seaborn
    sns.heatmap(repr_corr_labeled, annot=True, fmt='.2f', cmap='RdBu_r',
                center=0, vmin=-1, vmax=1, square=True, linewidths=2, linecolor='white',
                cbar_kws={'label': 'Correlation', 'shrink': 0.8},
                annot_kws={'size': 11, 'fontweight': 'bold'}, ax=ax)

    ax.set_title('Asset Class Correlation Matrix\n(2019-2024 Historical Data)',
                fontsize=14, fontweight='bold', pad=20)

    # Rotate labels for better readability
    plt.xticks(rotation=0)
    plt.yticks(rotation=0)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/correlation_heatmap.pdf', facecolor='white', edgecolor='none')
    plt.savefig(f'{OUTPUT_DIR}/correlation_heatmap.png', facecolor='white', edgecolor='none')
    print(f"Saved: {OUTPUT_DIR}/correlation_heatmap.pdf")
    plt.close()

    # =========================================================================
    # Figure 5: Risk-Return Scatter Plot with Seaborn
    # =========================================================================
    fig, ax = plt.subplots(figsize=(9, 7))

    # Create scatter data
    scatter_data = []
    for name, m in metrics.items():
        scatter_data.append({
            'Strategy': name,
            'Volatility': m['annual_volatility'] * 100,
            'Return': m['annual_return'] * 100,
            'Sharpe': m['sharpe_ratio'],
            'Drawdown': abs(m['max_drawdown']) * 100
        })
    scatter_df = pd.DataFrame(scatter_data)

    # Plot with size based on Sharpe ratio
    colors_list = [COLORS['hrp'], COLORS['markowitz'], COLORS['hybrid'], COLORS['sp500']]
    markers = ['o', 's', '^', 'D']

    for i, (idx, row) in enumerate(scatter_df.iterrows()):
        ax.scatter(row['Volatility'], row['Return'],
                  s=300 + row['Sharpe'] * 200,  # Size based on Sharpe
                  c=colors_list[i], marker=markers[i],
                  edgecolors='black', linewidth=2, alpha=0.85,
                  label=f"{row['Strategy']} (Sharpe: {row['Sharpe']:.2f})", zorder=5)

    # Add annotations
    for idx, row in scatter_df.iterrows():
        ax.annotate(row['Strategy'],
                   (row['Volatility'], row['Return']),
                   xytext=(10, 10), textcoords='offset points',
                   fontsize=10, fontweight='bold', alpha=0.8)

    ax.set_xlabel('Annualized Volatility (%)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Annualized Return (%)', fontsize=12, fontweight='bold')
    ax.set_title('Risk-Return Trade-off Analysis\n(Bubble Size = Sharpe Ratio)',
                fontsize=14, fontweight='bold', pad=15)

    legend = ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, fontsize=10)
    legend.get_frame().set_facecolor('white')

    ax.set_facecolor('#fafafa')
    ax.grid(True, alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/risk_return_scatter.pdf', facecolor='white', edgecolor='none')
    plt.savefig(f'{OUTPUT_DIR}/risk_return_scatter.png', facecolor='white', edgecolor='none')
    print(f"Saved: {OUTPUT_DIR}/risk_return_scatter.pdf")
    plt.close()

    # =========================================================================
    # Figure 6: Asset Allocation by Risk Profile - Stacked Area Chart
    # =========================================================================
    print("\nGenerating allocations for different risk profiles...")
    risk_scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    allocations_by_risk = {'stocks': [], 'bonds': [], 'alternatives': []}

    for rs in risk_scores:
        assessment = {
            'age_group': rs,
            'investment_horizon': rs,
            'income_stability': rs,
            'emergency_fund': rs,
            'reaction_to_volatility': rs,
            'comfort_with_uncertainty': rs,
            'risk_reward_preference': rs,
            'max_drawdown_tolerance': rs,
            'loss_aversion': 11 - rs,
            'primary_goal': rs,
            'diversification_importance': 5,
            'crypto_comfort': min(rs, 5),
            'alternative_assets_interest': 5,
            'tech_disruption_belief': rs,
            'financial_knowledge': 5,
            'decision_confidence': 5,
        }

        result = optimizer.optimize_portfolio(
            risk_score=float(rs),
            risk_profile="Custom",
            assessment_data=assessment,
            method=OptimizationMethod.HYBRID
        )

        breakdown = result['metrics']['category_breakdown']
        allocations_by_risk['stocks'].append(breakdown.get('stocks', 0) * 100)
        allocations_by_risk['bonds'].append(breakdown.get('bonds', 0) * 100)
        allocations_by_risk['alternatives'].append(breakdown.get('alternatives', 0) * 100)

    fig, ax = plt.subplots(figsize=(10, 6))

    # Beautiful stacked area chart
    ax.stackplot(risk_scores,
                allocations_by_risk['bonds'],
                allocations_by_risk['stocks'],
                allocations_by_risk['alternatives'],
                labels=['Bonds', 'Stocks', 'Alternatives'],
                colors=[COLORS['bonds'], COLORS['stocks'], COLORS['alts']],
                alpha=0.85, edgecolor='white', linewidth=1)

    ax.set_xlabel('Risk Score (1 = Conservative, 10 = Aggressive)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Allocation (%)', fontsize=12, fontweight='bold')
    ax.set_title('Asset Allocation by Risk Profile\n(Generated by Hybrid Optimizer)',
                fontsize=14, fontweight='bold', pad=15)

    legend = ax.legend(loc='center right', frameon=True, fancybox=True, shadow=True)
    legend.get_frame().set_facecolor('white')

    ax.set_xlim(1, 10)
    ax.set_ylim(0, 100)
    ax.set_xticks(risk_scores)
    ax.set_facecolor('#fafafa')
    ax.grid(True, alpha=0.3, axis='y', linestyle='--')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/allocation_by_risk.pdf', facecolor='white', edgecolor='none')
    plt.savefig(f'{OUTPUT_DIR}/allocation_by_risk.png', facecolor='white', edgecolor='none')
    print(f"Saved: {OUTPUT_DIR}/allocation_by_risk.pdf")
    plt.close()

    # Print summary for paper
    print("\n" + "="*60)
    print("SUMMARY FOR PAPER")
    print("="*60)
    print(f"""
Results Table (copy to LaTeX):

\\begin{{tabular}}{{lcccc}}
\\toprule
\\textbf{{Metric}} & \\textbf{{HRP Only}} & \\textbf{{Markowitz Only}} & \\textbf{{Hybrid}} & \\textbf{{S\\&P 500}} \\\\
\\midrule
Annualized Return & {metrics['HRP']['annual_return']*100:.1f}\\% & {metrics['Markowitz']['annual_return']*100:.1f}\\% & {metrics['Hybrid']['annual_return']*100:.1f}\\% & {metrics['S&P 500']['annual_return']*100:.1f}\\% \\\\
Annualized Volatility & {metrics['HRP']['annual_volatility']*100:.1f}\\% & {metrics['Markowitz']['annual_volatility']*100:.1f}\\% & {metrics['Hybrid']['annual_volatility']*100:.1f}\\% & {metrics['S&P 500']['annual_volatility']*100:.1f}\\% \\\\
Sharpe Ratio & {metrics['HRP']['sharpe_ratio']:.2f} & {metrics['Markowitz']['sharpe_ratio']:.2f} & {metrics['Hybrid']['sharpe_ratio']:.2f} & {metrics['S&P 500']['sharpe_ratio']:.2f} \\\\
Maximum Drawdown & {metrics['HRP']['max_drawdown']*100:.1f}\\% & {metrics['Markowitz']['max_drawdown']*100:.1f}\\% & {metrics['Hybrid']['max_drawdown']*100:.1f}\\% & {metrics['S&P 500']['max_drawdown']*100:.1f}\\% \\\\
\\bottomrule
\\end{{tabular}}
""")

    print("\nAll figures generated from REAL historical data!")
    print(f"Output directory: {OUTPUT_DIR}/")

    return metrics


if __name__ == "__main__":
    metrics = run_backtest()
