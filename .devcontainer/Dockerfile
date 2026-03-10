FROM mcr.microsoft.com/devcontainers/javascript-node:20
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv python3-dev \
    git curl wget unzip zip jq ca-certificates build-essential pkg-config libssl-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspaces/gitoracle
