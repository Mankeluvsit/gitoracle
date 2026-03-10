FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    zip \
    jq \
    ca-certificates \
    build-essential \
    pkg-config \
    libssl-dev \
    python3-venv \
    python3-dev \
    python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

USER vscode

RUN npm install -g yarn@1.22.22

WORKDIR /workspaces/gitoracle
