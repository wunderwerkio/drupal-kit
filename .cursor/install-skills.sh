#!/usr/bin/env bash
set -euo pipefail

SKILLS_DIR="${HOME}/.cursor/skills"
REPO_URL="https://github.com/wunderwerkio/wunderskills.git"

mkdir -p "${HOME}/.cursor"

if [ -d "${SKILLS_DIR}/.git" ]; then
  git -C "${SKILLS_DIR}" pull --ff-only
else
  git clone "${REPO_URL}" "${SKILLS_DIR}"
fi
