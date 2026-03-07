#!/usr/bin/env bash
set -euo pipefail
mkdir -p test_reports
python -m pip install --upgrade pip pip-audit
python -m pip_audit -r backend/requirements.txt --format=json > test_reports/python_audit.json || true
echo "Python audit written to test_reports/python_audit.json"
