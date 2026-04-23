FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libnspr4 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    xvfb \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /workspaces/TheVillainsClub \
  && chown -R node:node /workspaces

USER node
WORKDIR /workspaces/TheVillainsClub
