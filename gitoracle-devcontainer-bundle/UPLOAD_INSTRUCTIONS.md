# gitoracle dev container bundle

## Files included

- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`
- `.devcontainer/Dockerfile`
- `.devcontainer/scripts/post-create.sh`
- `.devcontainer/scripts/post-start.sh`
- `backend/.env.example`
- `.github/workflows/codespaces-prebuild.yml`
- `scripts/dev-logs.sh`

## What this bundle does

- Opens the repo directly in VS Code Dev Containers or GitHub Codespaces.
- Starts a MongoDB service automatically.
- Installs frontend dependencies with Yarn.
- Creates `backend/.venv` and installs Python dependencies.
- Starts the frontend on port `3000` and backend on port `8001` automatically.

## Upload steps

1. Extract this archive at the root of your repo.
2. Commit the new files.
3. In GitHub, open the repo and start a Codespace, or open locally in VS Code and choose **Reopen in Container**.

## Optional `.gitignore` additions

Add these lines if they are not already ignored:

```gitignore
.devcontainer/.runtime/
backend/.venv/
frontend/node_modules/
backend/.env
```

## Notes

- This bundle is tailored to your current repo layout: `frontend/` + `backend/` + optional MongoDB.
- It does **not** add Postgres or Redis because your current backend is already wired for MongoDB/in-memory storage.
- If your frontend expects a specific API base URL env var, keep your current frontend env setup. This bundle does not overwrite it.
