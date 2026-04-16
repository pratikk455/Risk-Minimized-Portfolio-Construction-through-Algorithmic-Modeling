# Hedgewise — Capstone Presentation

A premium, story-driven web presentation built with Next.js 14, Tailwind, Framer Motion, D3, and qrcode.react. Thirteen slides, real data, live iframes of the actual app.

## Quick start

```bash
# 1. one-time install
npm install

# 2. one-time data prep (reads CSVs from ../portfolio-risk-app)
npm run prepare-data

# 3. run just the presentation
npm run dev          # → http://localhost:4000

# 4. OR run everything (backend + main app + presentation)
./start-all.sh
./stop-all.sh        # to stop later
```

The iframe slides (5–7) need the main app running on `http://localhost:3000` and the backend on `http://localhost:8000`. `start-all.sh` boots all three.

## Keyboard

| Key | Action |
|---|---|
| `→` `Space` `PgDn` | Next step / next slide |
| `←` `PgUp` | Previous |
| `1`–`9` `0` | Jump to slide 1–10 |
| `Home` / `End` | First / last slide |
| `N` | Toggle speaker notes |
| `F` | Toggle fullscreen |

URL hash (`#slide=5&step=2`) preserves position across refreshes.

## Slides

| # | Slide | Has D3 chart | Has iframe |
|---|---|---|---|
| 1 | Title — Hedgewise | | |
| 2 | Hook (childhood) | | |
| 3 | Problem (Mag Seven) | ✓ donut | |
| 4 | Meet Sraddha | | |
| 5 | Questionnaire | | ✓ /assessment |
| 6 | Portfolio | | ✓ /portfolio |
| 7 | Trading | | ✓ /trading |
| 8 | HRP + Markowitz | ✓ allocation bars | |
| 9 | Backtest | ✓ line chart | |
| 10 | Monte Carlo | ✓ scatter | |
| 11 | What's Next | | |
| 12 | What I Learned | | |
| 13 | Any Questions + QR codes + Thank you | | |

## Data sources

`scripts/prepare-data.mjs` reads from `../portfolio-risk-app/`:

- `paper_figures/monte_carlo_results.csv` → sampled scatter points
- `coefficient_analysis.py` results → α grid search (currently hardcoded mirror of paper Table 4)
- backtest line series → calibrated against published metrics (Hybrid Sharpe 0.97, DD −26.5% vs S&P 0.93, −33.7%)

Re-run `npm run prepare-data` if the source numbers change.
