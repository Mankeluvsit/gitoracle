#!/usr/bin/env bash
set -euo pipefail
mkdir -p test_reports
cd frontend
if command -v yarn >/dev/null 2>&1 && [ -f yarn.lock ]; then
  yarn --frozen-lockfile
else
  npm ci
fi
npm audit --json > ../test_reports/frontend_audit.json || true
echo "Frontend audit written to test_reports/frontend_audit.json"
