#!/usr/bin/env bash
# Local dev server that keeps running until you press Ctrl+C.
# Restarts Hugo automatically if it ever exits. Use Ctrl+C to stop (not Ctrl+Z, which only suspends it and keeps the port busy).
cd "$(dirname "$0")" || exit 1
PORT="${PORT:-1313}"
if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
  echo "Port $PORT is already in use:"; ss -ltnp | grep ":$PORT "
  echo "Stop that process first (or run: PORT=1400 ./dev.sh)"; exit 1
fi
trap 'echo; echo "Stopped."; exit 0' INT TERM
while true; do
  hugo server --port "$PORT" --bind 127.0.0.1 --disableFastRender
  echo "Hugo exited (code $?). Restarting in 2s... (Ctrl+C to stop)"; sleep 2
done
