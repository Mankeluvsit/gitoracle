#!/usr/bin/env bash
set -euo pipefail

ROOT="/workspaces/gitoracle"
RUNTIME_DIR="$ROOT/.devcontainer/.runtime"
mkdir -p "$RUNTIME_DIR"

start_backend() {
  if [ ! -f "$ROOT/backend/server.py" ]; then
    return 0
  fi

  if [ -f "$RUNTIME_DIR/backend.pid" ] && kill -0 "$(cat "$RUNTIME_DIR/backend.pid")" 2>/dev/null; then
    echo "[post-start] Backend already running."
    return 0
  fi

  echo "[post-start] Starting backend on :8001"
  cd "$ROOT/backend"
  if [ -f .venv/bin/activate ]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  fi

  export MONGO_URL="${MONGO_URL:-mongodb://mongo:27017}"
  export DB_NAME="${DB_NAME:-gitoracle}"
  nohup uvicorn server:app --host 0.0.0.0 --port 8001 --reload > "$RUNTIME_DIR/backend.log" 2>&1 &
  echo $! > "$RUNTIME_DIR/backend.pid"
  cd "$ROOT"
}

start_frontend() {
  if [ ! -f "$ROOT/frontend/package.json" ]; then
    return 0
  fi

  if [ -f "$RUNTIME_DIR/frontend.pid" ] && kill -0 "$(cat "$RUNTIME_DIR/frontend.pid")" 2>/dev/null; then
    echo "[post-start] Frontend already running."
    return 0
  fi

  echo "[post-start] Starting frontend on :3000"
  cd "$ROOT/frontend"
  export HOST="0.0.0.0"
  export PORT="3000"
  export BROWSER="none"
  export CHOKIDAR_USEPOLLING="true"
  nohup yarn start > "$RUNTIME_DIR/frontend.log" 2>&1 &
  echo $! > "$RUNTIME_DIR/frontend.pid"
  cd "$ROOT"
}

start_backend
start_frontend

echo "[post-start] Logs:"
echo "  Backend : $RUNTIME_DIR/backend.log"
echo "  Frontend: $RUNTIME_DIR/frontend.log"
