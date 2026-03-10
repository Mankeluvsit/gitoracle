#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT/.devcontainer/.runtime"

if [ -f "$RUNTIME_DIR/backend.log" ]; then
  echo "===== backend.log ====="
  tail -n 50 "$RUNTIME_DIR/backend.log"
else
  echo "No backend log found."
fi

echo

if [ -f "$RUNTIME_DIR/frontend.log" ]; then
  echo "===== frontend.log ====="
  tail -n 50 "$RUNTIME_DIR/frontend.log"
else
  echo "No frontend log found."
fi
