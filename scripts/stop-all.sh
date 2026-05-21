#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[stop] Stopping OpenCTI core, connectors, and AI enrichment..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.connectors.yml \
  -f docker-compose.ai.yml \
  down --remove-orphans

echo "[stop] Done. Volumes are preserved."
