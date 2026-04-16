#!/bin/bash
# Start all three services for the presentation:
#   - Backend (FastAPI)            on :8000
#   - Main app frontend (Next.js)  on :3001
#   - Presentation (Next.js)       on :4000

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$ROOT/../portfolio-risk-app" && pwd)"
LOG="$ROOT/.presentation-logs"
mkdir -p "$LOG"

echo "→ Starting backend on :8000"
(
  cd "$APP/backend"
  source venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$LOG/backend.log" 2>&1 &
  echo $! > "$LOG/backend.pid"
)

echo "→ Starting main app frontend on :3001"
(
  cd "$APP/frontend"
  PORT=3001 NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev -- -p 3001 > "$LOG/frontend.log" 2>&1 &
  echo $! > "$LOG/frontend.pid"
)

echo "→ Starting presentation on :4000"
(
  cd "$ROOT"
  npm run dev > "$LOG/presentation.log" 2>&1 &
  echo $! > "$LOG/presentation.pid"
)

sleep 4
echo
echo "✓ All services starting. Open: http://localhost:4000"
echo "  Logs in:        $LOG/"
echo "  Stop with:      $ROOT/stop-all.sh"
