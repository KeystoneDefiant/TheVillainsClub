#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if [[ -f .gitmodules ]]; then
  git submodule update --init --recursive || true
fi
