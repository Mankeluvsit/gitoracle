# gitoracle

This repository contains a frontend React app and a Python backend. Use the `frontend` and `backend` folders to work on each part.

Development:

- Start the backend: see `backend/README` (if present)
- Start the frontend: see `frontend/README` (if present)

Backend quickstart (local):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

Backend environment:

- `OPENAI_API_KEY` optional. If unset, search parsing and AI insights fall back to non-LLM behavior.
- `MONGO_URL` optional. If unset, the API runs with an in-memory store for settings/history/bookmarks.
- `DB_NAME` optional (default `gitoracle`).

Notes:

- The project does not require any platform-specific managed services or packages to run.
- Frontend visual-edit middleware is disabled by default. To enable it in local dev, set `ENABLE_VISUAL_EDITS=true` before `npm start`.

Automated dependency audits

This repository includes CI workflows and local scripts to run dependency audits for frontend and backend:

- GitHub Actions workflow: `.github/workflows/dependency-audit.yml` — runs `npm audit` for the frontend and `pip-audit` for the Python requirements on pushes and PRs and uploads JSON reports as artifacts.
- Local helper scripts:
  - `scripts/run_frontend_audit.sh` — runs `npm ci`/`yarn` and writes `test_reports/frontend_audit.json`.
  - `scripts/run_python_audit.sh` — installs `pip-audit` and writes `test_reports/python_audit.json`.

Run locally:
```bash
# frontend
./scripts/run_frontend_audit.sh

# python
./scripts/run_python_audit.sh
```

After running, review `test_reports/*.json` for findings and share them if you want help prioritizing and fixing.
