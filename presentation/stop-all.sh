#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG="$ROOT/.presentation-logs"
for svc in backend frontend presentation; do
  if [ -f "$LOG/$svc.pid" ]; then
    PID="$(cat "$LOG/$svc.pid")"
    if kill -0 "$PID" 2>/dev/null; then
      echo "→ Stopping $svc (pid $PID)"
      kill "$PID" 2>/dev/null || true
    fi
    rm -f "$LOG/$svc.pid"
  fi
done
echo "✓ All services stopped."
