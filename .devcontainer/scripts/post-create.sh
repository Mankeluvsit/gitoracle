#!/usr/bin/env bash
set -e
if [ -f frontend/package.json ]; then
  cd frontend
  if command -v yarn >/dev/null 2>&1; then
    yarn install
  else
    npm install
  fi
  cd ..
fi
if [ -f backend/requirements.txt ]; then
  cd backend
  python3 -m venv .venv
  . .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
  cd ..
fi
