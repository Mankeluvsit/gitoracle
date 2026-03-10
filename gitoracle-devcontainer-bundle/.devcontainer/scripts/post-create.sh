#!/usr/bin/env bash
set -euo pipefail

cd /workspaces/gitoracle

echo "[post-create] Installing frontend dependencies..."
if [ -f frontend/package.json ]; then
  cd frontend
  yarn install --frozen-lockfile || yarn install
  cd ..
fi

echo "[post-create] Creating backend virtual environment..."
if [ -f backend/requirements.txt ]; then
  python -m venv backend/.venv
  source backend/.venv/bin/activate
  python -m pip install --upgrade pip wheel
  pip install -r backend/requirements.txt
  deactivate
fi

if [ -f backend/.env.example ] && [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "[post-create] Created backend/.env from backend/.env.example"
fi

echo "[post-create] Done."
