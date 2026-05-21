#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"

wait_for_opencti() {
  local deadline=$((SECONDS + WAIT_TIMEOUT))

  echo "[start] Waiting for OpenCTI API on http://localhost:8080..."
  until curl -fsS http://localhost:8080 >/dev/null 2>&1; do
    if (( SECONDS >= deadline )); then
      echo "[start] OpenCTI did not become reachable within ${WAIT_TIMEOUT}s." >&2
      echo "[start] Check logs with: docker compose logs -f opencti" >&2
      return 1
    fi
    sleep 5
  done
}

echo "[start] Starting OpenCTI core stack..."
docker compose -f docker-compose.yml up -d

wait_for_opencti

echo "[start] Starting external connectors..."
docker compose -f docker-compose.connectors.yml up -d

echo "[start] Building and starting AI enrichment connector..."
docker compose -f docker-compose.ai.yml up -d --build

echo "[start] Done."
docker compose -f docker-compose.yml ps
