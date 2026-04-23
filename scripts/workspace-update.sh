#!/usr/bin/env bash
# Minimal workspace sync: submodules then npm ci. Default root is /workspace when it
# is this repo; otherwise the directory containing package.json next to this script.
# Override with WORKSPACE_ROOT.
set -euo pipefail

_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_repo_from_script="$(cd "$_script_dir/.." && pwd)"

if [[ -z "${WORKSPACE_ROOT:-}" ]]; then
  if [[ -d /workspace && -f /workspace/package.json ]]; then
    WORKSPACE_ROOT=/workspace
  else
    WORKSPACE_ROOT="$_repo_from_script"
  fi
fi

cd "$WORKSPACE_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not a git repository: $WORKSPACE_ROOT" >&2
  exit 1
fi

if [[ -f .gitmodules ]]; then
  git submodule update --init --recursive
fi

if [[ -f package-lock.json ]]; then
  npm ci
else
  echo "error: package-lock.json missing; run npm install once, then commit the lockfile." >&2
  exit 1
fi
