# Hedgewise

**Risk Minimized Portfolio Construction through Algorithmic Modeling**

A Furman Fellows project by Pratik Shrestha. Hedgewise builds personalized investment portfolios for everyday investors using Hierarchical Risk Parity (HRP) blended with Markowitz mean-variance optimization, validated against six years of market data and 10,000 Monte Carlo simulations.

## What's in this repo

| Folder | What it is |
|---|---|
| [`portfolio-risk-app/`](portfolio-risk-app/) | The full-stack app: FastAPI backend + Next.js frontend. 30-question risk assessment, portfolio construction, paper + live trading via Alpaca. |
| [`presentation/`](presentation/) | The 13-slide capstone presentation. Next.js + D3 + Framer Motion. Live charts driven by real backtest data. |
| [`portfolio-risk-app/paper_final.tex`](portfolio-risk-app/paper_final.tex) | The full research paper. |
| [`portfolio-risk-app/paper_demo.pdf`](portfolio-risk-app/paper_demo.pdf) | Compiled paper PDF. |
| [`portfolio-risk-app/Hedgewise Final (1).pdf`](portfolio-risk-app/Hedgewise%20Final%20%281%29.pdf) | Furman Fellows poster. |

## Headline results

- **Sharpe ratio:** 0.97 (S&P 500 baseline: 0.93)
- **Worst drawdown:** −26.5% (S&P 500: −33.7%)
- **Monte Carlo wins:** 79.2% of 10,000 simulated portfolios beat the S&P 500 on Sharpe; 100% had lower drawdown
- **Hybrid blend:** α = 0.4 (40% history, 60% simulation), chosen via grid search

## Running locally

Three services across three ports:

| Service | Port | Start command |
|---|---|---|
| Backend (FastAPI) | 8000 | `cd portfolio-risk-app/backend && uvicorn app.main:app --reload --port 8000` |
| App frontend (Next.js) | 3000 | `cd portfolio-risk-app/frontend && npm run dev` |
| Presentation (Next.js) | 4000 | `cd presentation && npm run dev` |

Or use the helper script:

```bash
cd presentation
./start-all.sh        # boots all three
./stop-all.sh         # stops all three
```

The presentation slides 5–7 embed the live app via iframe, so the backend and app frontend must be running for those to work.

## Tech stack

**Backend:** Python, FastAPI, Pydantic, Alpaca SDK, NumPy, Pandas, SciPy
**Frontend:** Next.js 14 App Router, TypeScript, Tailwind, Framer Motion
**Presentation:** Next.js 14, D3, Framer Motion, qrcode.react
**Data:** 13-ETF universe, 6 years daily returns (2019–2024), 10,000-run Monte Carlo

## License

Open source. Built at Furman.
