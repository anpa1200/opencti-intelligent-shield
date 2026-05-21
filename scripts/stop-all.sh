#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[stop] Stopping AI enrichment connector..."
docker compose -f docker-compose.ai.yml down --remove-orphans

echo "[stop] Stopping external connectors..."
docker compose -f docker-compose.connectors.yml down --remove-orphans

echo "[stop] Stopping OpenCTI core stack..."
docker compose -f docker-compose.yml down --remove-orphans

echo "[stop] Done. Volumes are preserved."
