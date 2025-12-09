"""
Monte Carlo Simulation for Portfolio Risk Optimization Paper
Simulates 1000s of portfolios with different risk profiles and compares
their Sharpe ratios and crash performance to S&P 500.
"""

import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os
import sys
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

# Add backend to path to import the actual optimizer
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.services.portfolio_optimizer import PortfolioOptimizer, OptimizationMethod

# Set beautiful Seaborn style
sns.set_theme(style="whitegrid", context="paper", font_scale=1.2)

# Custom color palette
COLORS = {
    'sp500': '#2E86AB',
    'hybrid': '#C73E1D',
    'better': '#27ae60',
    'worse': '#e74c3c',
    'neutral': '#95a5a6',
}

plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
    'figure.figsize': (10, 6),
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
})

OUTPUT_DIR = "paper_figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ETFs for simulation
BACKTEST_ETFS = [
    'VOO', 'VTI', 'QQQ', 'SCHD', 'VTV', 'VWO', 'VXUS', 'XLU',
    'BND', 'TLT', 'TIP', 'GLD', 'VNQ', 'XLE'
]
BENCHMARK = 'SPY'
START_DATE = '2019-01-01'
END_DATE = '2024-12-01'

# Stress periods for analysis
STRESS_PERIODS = {
    'COVID Crash': ('2020-02-19', '2020-03-23'),
    '2022 Bear Market': ('2022-01-03', '2022-10-12'),
    '2020 Recovery': ('2020-03-23', '2020-12-31'),
    '2023-24 Rally': ('2023-01-01', '2024-11-30'),
}


def download_data():
    """Download historical price data"""
    print("Downloading historical data...")
    all_tickers = BACKTEST_ETFS + [BENCHMARK]
    data = yf.download(all_tickers, start=START_DATE, end=END_DATE, progress=False, auto_adjust=True)

    if 'Close' in data.columns.get_level_values(0):
        data = data['Close']
    elif isinstance(data.columns, pd.MultiIndex):
        data = data.droplevel(0, axis=1) if data.columns.nlevels > 1 else data

    print(f"Downloaded {len(data)} days of data")
    return data


def calculate_metrics(returns_series):
    """Calculate performance metrics for a return series"""
    annual_return = (1 + returns_series.mean()) ** 252 - 1
    annual_vol = returns_series.std() * np.sqrt(252)
    sharpe = annual_return / annual_vol if annual_vol > 0 else 0

    cumulative = (1 + returns_series).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min()

    return {
        'annual_return': annual_return,
        'annual_volatility': annual_vol,
        'sharpe_ratio': sharpe,
        'max_drawdown': max_drawdown
    }


def generate_random_assessment():
    """Generate random assessment data for portfolio simulation"""
    return {
        'age_group': np.random.randint(1, 11),
        'investment_horizon': np.random.randint(1, 11),
        'income_stability': np.random.randint(1, 11),
        'emergency_fund': np.random.randint(1, 11),
        'reaction_to_volatility': np.random.randint(1, 11),
        'comfort_with_uncertainty': np.random.randint(1, 11),
        'risk_reward_preference': np.random.randint(1, 11),
        'max_drawdown_tolerance': np.random.randint(1, 11),
        'loss_aversion': np.random.randint(1, 11),
        'primary_goal': np.random.randint(1, 11),
        'diversification_importance': np.random.randint(1, 11),
        'crypto_comfort': np.random.randint(1, 6),  # Lower for backtest period
        'alternative_assets_interest': np.random.randint(1, 11),
        'tech_disruption_belief': np.random.randint(1, 11),
        'financial_knowledge': np.random.randint(1, 11),
        'decision_confidence': np.random.randint(1, 11),
    }


def calculate_risk_score(assessment):
    """Calculate risk score from assessment (simplified version)"""
    # Weight different factors
    risk_factors = [
        assessment['age_group'],
        assessment['investment_horizon'],
        assessment['risk_reward_preference'],
        assessment['max_drawdown_tolerance'],
        assessment['comfort_with_uncertainty'],
    ]
    conservative_factors = [
        assessment['loss_aversion'],
    ]

    risk_score = np.mean(risk_factors) - 0.3 * np.mean(conservative_factors) + 3
    return max(1, min(10, risk_score))


def filter_weights(weights, available_tickers):
    """Filter weights for available tickers and renormalize"""
    filtered = {k: v for k, v in weights.items() if k in available_tickers and v > 0.001}
    total = sum(filtered.values())
    if total > 0:
        filtered = {k: v/total for k, v in filtered.items()}
    return filtered


def run_monte_carlo(n_simulations=1000):
    """Run Monte Carlo simulation with n portfolios"""

    # Download data
    prices = download_data()
    returns = prices.pct_change().dropna()

    etf_returns = returns[BACKTEST_ETFS]
    benchmark_returns = returns[BENCHMARK]

    # Calculate S&P 500 metrics
    sp500_metrics = calculate_metrics(benchmark_returns)
    print(f"\nS&P 500 Baseline:")
    print(f"  Sharpe: {sp500_metrics['sharpe_ratio']:.3f}")
    print(f"  Return: {sp500_metrics['annual_return']*100:.1f}%")
    print(f"  Max DD: {sp500_metrics['max_drawdown']*100:.1f}%")

    # Initialize optimizer
    optimizer = PortfolioOptimizer()

    # Storage for results
    results = []

    print(f"\nSimulating {n_simulations} portfolios...")

    for i in tqdm(range(n_simulations)):
        try:
            # Generate random assessment
            assessment = generate_random_assessment()
            risk_score = calculate_risk_score(assessment)

            # Get portfolio weights using hybrid method
            result = optimizer.optimize_portfolio(
                risk_score=risk_score,
                risk_profile="Simulated",
                assessment_data=assessment,
                method=OptimizationMethod.HYBRID
            )

            weights = result['allocations']
            filtered_weights = filter_weights(weights, BACKTEST_ETFS)

            if not filtered_weights:
                continue

            # Calculate portfolio returns
            weight_array = np.array([filtered_weights.get(c, 0) for c in BACKTEST_ETFS])
            portfolio_returns = (etf_returns * weight_array).sum(axis=1)

            # Calculate full-period metrics
            metrics = calculate_metrics(portfolio_returns)

            # Calculate stress period metrics
            stress_metrics = {}
            for period_name, (start, end) in STRESS_PERIODS.items():
                try:
                    period_port_ret = portfolio_returns.loc[start:end]
                    period_bench_ret = benchmark_returns.loc[start:end]

                    if len(period_port_ret) > 0:
                        port_total = (1 + period_port_ret).prod() - 1
                        bench_total = (1 + period_bench_ret).prod() - 1
                        stress_metrics[f'{period_name}_return'] = port_total
                        stress_metrics[f'{period_name}_vs_sp500'] = port_total - bench_total
                except:
                    pass

            # Store results
            results.append({
                'simulation_id': i,
                'risk_score': risk_score,
                'sharpe_ratio': metrics['sharpe_ratio'],
                'annual_return': metrics['annual_return'],
                'annual_volatility': metrics['annual_volatility'],
                'max_drawdown': metrics['max_drawdown'],
                'beats_sp500_sharpe': metrics['sharpe_ratio'] > sp500_metrics['sharpe_ratio'],
                'beats_sp500_drawdown': metrics['max_drawdown'] > sp500_metrics['max_drawdown'],
                **stress_metrics
            })

        except Exception as e:
            continue

    df = pd.DataFrame(results)
    print(f"\nSuccessfully simulated {len(df)} portfolios")

    return df, sp500_metrics


def generate_figures(df, sp500_metrics):
    """Generate beautiful visualizations"""

    print("\nGenerating figures...")

    # =========================================================================
    # Figure 1: Sharpe Ratio Distribution vs S&P 500
    # =========================================================================
    fig, ax = plt.subplots(figsize=(10, 6))

    # Histogram of Sharpe ratios
    n, bins, patches = ax.hist(df['sharpe_ratio'], bins=50, edgecolor='white',
                                linewidth=0.5, alpha=0.7, color=COLORS['hybrid'])

    # Color bars based on whether they beat S&P 500
    for i, patch in enumerate(patches):
        if bins[i] >= sp500_metrics['sharpe_ratio']:
            patch.set_facecolor(COLORS['better'])
        else:
            patch.set_facecolor(COLORS['worse'])

    # Add S&P 500 line
    ax.axvline(x=sp500_metrics['sharpe_ratio'], color=COLORS['sp500'],
               linewidth=3, linestyle='--', label=f"S&P 500 ({sp500_metrics['sharpe_ratio']:.2f})")

    # Add mean line
    mean_sharpe = df['sharpe_ratio'].mean()
    ax.axvline(x=mean_sharpe, color='black', linewidth=2, linestyle=':',
               label=f"Mean Portfolio ({mean_sharpe:.2f})")

    # Stats annotation
    pct_beat = (df['sharpe_ratio'] > sp500_metrics['sharpe_ratio']).mean() * 100
    ax.text(0.97, 0.95, f"{pct_beat:.1f}% of portfolios\nbeat S&P 500 Sharpe",
            transform=ax.transAxes, fontsize=12, fontweight='bold',
            verticalalignment='top', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))

    ax.set_xlabel('Sharpe Ratio', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Portfolios', fontsize=12, fontweight='bold')
    ax.set_title(f'Sharpe Ratio Distribution ({len(df):,} Simulated Portfolios)',
                 fontsize=14, fontweight='bold')
    ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True)
    ax.set_facecolor('#fafafa')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_sharpe.pdf', facecolor='white')
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_sharpe.png', facecolor='white')
    print(f"Saved: {OUTPUT_DIR}/monte_carlo_sharpe.pdf")
    plt.close()

    # =========================================================================
    # Figure 2: Risk Score vs Sharpe Ratio Scatter
    # =========================================================================
    fig, ax = plt.subplots(figsize=(10, 7))

    # Create color based on whether beats S&P 500
    colors = [COLORS['better'] if s > sp500_metrics['sharpe_ratio'] else COLORS['worse']
              for s in df['sharpe_ratio']]

    scatter = ax.scatter(df['risk_score'], df['sharpe_ratio'],
                        c=colors, alpha=0.5, s=30, edgecolors='none')

    # Add S&P 500 line
    ax.axhline(y=sp500_metrics['sharpe_ratio'], color=COLORS['sp500'],
               linewidth=2, linestyle='--', label=f"S&P 500 Sharpe ({sp500_metrics['sharpe_ratio']:.2f})")

    # Add trend line
    z = np.polyfit(df['risk_score'], df['sharpe_ratio'], 2)
    p = np.poly1d(z)
    x_line = np.linspace(df['risk_score'].min(), df['risk_score'].max(), 100)
    ax.plot(x_line, p(x_line), color='black', linewidth=2, linestyle='-',
            label='Trend (quadratic fit)')

    ax.set_xlabel('Risk Score (1=Conservative, 10=Aggressive)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Sharpe Ratio', fontsize=12, fontweight='bold')
    ax.set_title('Risk Score vs Sharpe Ratio\n(Green = Beats S&P 500)',
                 fontsize=14, fontweight='bold')
    ax.legend(loc='best', frameon=True, fancybox=True, shadow=True)
    ax.set_facecolor('#fafafa')
    ax.set_xlim(0.5, 10.5)

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_risk_vs_sharpe.pdf', facecolor='white')
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_risk_vs_sharpe.png', facecolor='white')
    print(f"Saved: {OUTPUT_DIR}/monte_carlo_risk_vs_sharpe.pdf")
    plt.close()

    # =========================================================================
    # Figure 3: Max Drawdown Distribution
    # =========================================================================
    fig, ax = plt.subplots(figsize=(10, 6))

    # Convert to positive percentages for easier reading
    drawdowns = df['max_drawdown'].abs() * 100
    sp500_dd = abs(sp500_metrics['max_drawdown']) * 100

    n, bins, patches = ax.hist(drawdowns, bins=50, edgecolor='white',
                                linewidth=0.5, alpha=0.7)

    # Color bars - green if LESS drawdown than S&P 500
    for i, patch in enumerate(patches):
        if bins[i] <= sp500_dd:
            patch.set_facecolor(COLORS['better'])
        else:
            patch.set_facecolor(COLORS['worse'])

    ax.axvline(x=sp500_dd, color=COLORS['sp500'], linewidth=3, linestyle='--',
               label=f"S&P 500 ({sp500_dd:.1f}%)")

    pct_better_dd = (drawdowns < sp500_dd).mean() * 100
    ax.text(0.97, 0.95, f"{pct_better_dd:.1f}% of portfolios\nhave lower max drawdown",
            transform=ax.transAxes, fontsize=12, fontweight='bold',
            verticalalignment='top', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))

    ax.set_xlabel('Maximum Drawdown (%)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Portfolios', fontsize=12, fontweight='bold')
    ax.set_title('Maximum Drawdown Distribution', fontsize=14, fontweight='bold')
    ax.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
    ax.set_facecolor('#fafafa')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_drawdown.pdf', facecolor='white')
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_drawdown.png', facecolor='white')
    print(f"Saved: {OUTPUT_DIR}/monte_carlo_drawdown.pdf")
    plt.close()

    # =========================================================================
    # Figure 4: COVID Crash Performance
    # =========================================================================
    if 'COVID Crash_return' in df.columns:
        fig, ax = plt.subplots(figsize=(10, 6))

        covid_returns = df['COVID Crash_return'] * 100

        n, bins, patches = ax.hist(covid_returns, bins=50, edgecolor='white',
                                    linewidth=0.5, alpha=0.7)

        # Get S&P 500 COVID return
        sp500_covid = df['COVID Crash_vs_sp500'].iloc[0] * 100 + covid_returns.iloc[0]
        # Actually calculate it properly
        sp500_covid_val = covid_returns.mean() - df['COVID Crash_vs_sp500'].mean() * 100

        for i, patch in enumerate(patches):
            if bins[i] > sp500_covid_val:
                patch.set_facecolor(COLORS['better'])
            else:
                patch.set_facecolor(COLORS['worse'])

        ax.axvline(x=sp500_covid_val, color=COLORS['sp500'], linewidth=3, linestyle='--',
                   label=f"S&P 500")
        ax.axvline(x=0, color='black', linewidth=1, alpha=0.5)

        pct_beat_covid = (df['COVID Crash_vs_sp500'] > 0).mean() * 100
        ax.text(0.03, 0.95, f"{pct_beat_covid:.1f}% of portfolios\nbeat S&P 500 during COVID",
                transform=ax.transAxes, fontsize=12, fontweight='bold',
                verticalalignment='top', horizontalalignment='left',
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))

        ax.set_xlabel('Return During COVID Crash (%)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Number of Portfolios', fontsize=12, fontweight='bold')
        ax.set_title('Portfolio Performance During COVID Crash (Feb-Mar 2020)',
                     fontsize=14, fontweight='bold')
        ax.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
        ax.set_facecolor('#fafafa')

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/monte_carlo_covid.pdf', facecolor='white')
        plt.savefig(f'{OUTPUT_DIR}/monte_carlo_covid.png', facecolor='white')
        print(f"Saved: {OUTPUT_DIR}/monte_carlo_covid.pdf")
        plt.close()

    # =========================================================================
    # Figure 5: 2022 Bear Market Performance
    # =========================================================================
    if '2022 Bear Market_return' in df.columns:
        fig, ax = plt.subplots(figsize=(10, 6))

        bear_returns = df['2022 Bear Market_return'] * 100
        sp500_bear_val = bear_returns.mean() - df['2022 Bear Market_vs_sp500'].mean() * 100

        n, bins, patches = ax.hist(bear_returns, bins=50, edgecolor='white',
                                    linewidth=0.5, alpha=0.7)

        for i, patch in enumerate(patches):
            if bins[i] > sp500_bear_val:
                patch.set_facecolor(COLORS['better'])
            else:
                patch.set_facecolor(COLORS['worse'])

        ax.axvline(x=sp500_bear_val, color=COLORS['sp500'], linewidth=3, linestyle='--',
                   label=f"S&P 500")
        ax.axvline(x=0, color='black', linewidth=1, alpha=0.5)

        pct_beat_bear = (df['2022 Bear Market_vs_sp500'] > 0).mean() * 100
        ax.text(0.03, 0.95, f"{pct_beat_bear:.1f}% of portfolios\nbeat S&P 500 in 2022",
                transform=ax.transAxes, fontsize=12, fontweight='bold',
                verticalalignment='top', horizontalalignment='left',
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.9))

        ax.set_xlabel('Return During 2022 Bear Market (%)', fontsize=12, fontweight='bold')
        ax.set_ylabel('Number of Portfolios', fontsize=12, fontweight='bold')
        ax.set_title('Portfolio Performance During 2022 Bear Market',
                     fontsize=14, fontweight='bold')
        ax.legend(loc='upper right', frameon=True, fancybox=True, shadow=True)
        ax.set_facecolor('#fafafa')

        plt.tight_layout()
        plt.savefig(f'{OUTPUT_DIR}/monte_carlo_2022.pdf', facecolor='white')
        plt.savefig(f'{OUTPUT_DIR}/monte_carlo_2022.png', facecolor='white')
        print(f"Saved: {OUTPUT_DIR}/monte_carlo_2022.pdf")
        plt.close()

    # =========================================================================
    # Figure 6: Risk-Return Efficient Frontier Style Plot
    # =========================================================================
    fig, ax = plt.subplots(figsize=(10, 8))

    # Color by Sharpe ratio
    scatter = ax.scatter(df['annual_volatility'] * 100, df['annual_return'] * 100,
                        c=df['sharpe_ratio'], cmap='RdYlGn',
                        alpha=0.6, s=30, edgecolors='none')

    # Add S&P 500 point
    ax.scatter(sp500_metrics['annual_volatility'] * 100, sp500_metrics['annual_return'] * 100,
               c=COLORS['sp500'], s=300, marker='*', edgecolors='black', linewidth=2,
               label=f"S&P 500", zorder=10)

    # Colorbar
    cbar = plt.colorbar(scatter, ax=ax, shrink=0.8)
    cbar.set_label('Sharpe Ratio', fontsize=11, fontweight='bold')

    ax.set_xlabel('Annualized Volatility (%)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Annualized Return (%)', fontsize=12, fontweight='bold')
    ax.set_title('Risk-Return Profile of Simulated Portfolios\n(Color = Sharpe Ratio)',
                 fontsize=14, fontweight='bold')
    ax.legend(loc='upper left', frameon=True, fancybox=True, shadow=True, fontsize=12)
    ax.set_facecolor('#fafafa')
    ax.grid(True, alpha=0.3, linestyle='--')

    plt.tight_layout()
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_efficient_frontier.pdf', facecolor='white')
    plt.savefig(f'{OUTPUT_DIR}/monte_carlo_efficient_frontier.png', facecolor='white')
    print(f"Saved: {OUTPUT_DIR}/monte_carlo_efficient_frontier.pdf")
    plt.close()

    # =========================================================================
    # Print Summary Statistics
    # =========================================================================
    print("\n" + "="*60)
    print("MONTE CARLO SIMULATION SUMMARY")
    print("="*60)

    print(f"\nTotal Portfolios Simulated: {len(df):,}")
    print(f"\nS&P 500 Benchmark:")
    print(f"  Sharpe Ratio: {sp500_metrics['sharpe_ratio']:.3f}")
    print(f"  Annual Return: {sp500_metrics['annual_return']*100:.1f}%")
    print(f"  Max Drawdown: {sp500_metrics['max_drawdown']*100:.1f}%")

    print(f"\nPortfolio Statistics:")
    print(f"  Mean Sharpe: {df['sharpe_ratio'].mean():.3f}")
    print(f"  Median Sharpe: {df['sharpe_ratio'].median():.3f}")
    print(f"  Best Sharpe: {df['sharpe_ratio'].max():.3f}")
    print(f"  Worst Sharpe: {df['sharpe_ratio'].min():.3f}")

    print(f"\n% Beating S&P 500:")
    print(f"  Higher Sharpe Ratio: {(df['sharpe_ratio'] > sp500_metrics['sharpe_ratio']).mean()*100:.1f}%")
    print(f"  Lower Max Drawdown: {(df['max_drawdown'].abs() < abs(sp500_metrics['max_drawdown'])).mean()*100:.1f}%")

    if 'COVID Crash_vs_sp500' in df.columns:
        print(f"  Beat during COVID Crash: {(df['COVID Crash_vs_sp500'] > 0).mean()*100:.1f}%")
    if '2022 Bear Market_vs_sp500' in df.columns:
        print(f"  Beat during 2022 Bear: {(df['2022 Bear Market_vs_sp500'] > 0).mean()*100:.1f}%")

    # Optimal risk score analysis
    print(f"\nOptimal Risk Score Analysis:")
    risk_groups = df.groupby(df['risk_score'].round())['sharpe_ratio'].mean()
    best_risk = risk_groups.idxmax()
    print(f"  Best avg Sharpe at risk score: {best_risk:.0f} ({risk_groups[best_risk]:.3f})")

    return df


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--n', type=int, default=1000, help='Number of simulations')
    args = parser.parse_args()

    df, sp500_metrics = run_monte_carlo(n_simulations=args.n)
    generate_figures(df, sp500_metrics)

    # Save results to CSV
    df.to_csv(f'{OUTPUT_DIR}/monte_carlo_results.csv', index=False)
    print(f"\nResults saved to {OUTPUT_DIR}/monte_carlo_results.csv")
