#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_PORT="${BACKEND_PORT:-3000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
API_URL="${VITE_API_URL:-http://localhost:${BACKEND_PORT}/api/v1}"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not installed."
  exit 1
fi

if [[ ! -d "$BACKEND_DIR" || ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: backend/ and frontend/ folders are required."
  exit 1
fi

echo "Starting Lean Taller stack..."
echo "- Backend:  http://localhost:${BACKEND_PORT}"
echo "- Frontend: http://localhost:${FRONTEND_PORT}"
echo "- API URL:  ${API_URL}"

if command -v docker >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  docker compose -f "$ROOT_DIR/docker-compose.yml" up -d
  echo "Waiting for PostgreSQL to be ready..."
  for i in {1..30}; do
    if docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres pg_isready -U lean >/dev/null 2>&1; then
      echo "PostgreSQL is ready"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "Error: PostgreSQL failed to start"
      exit 1
    fi
    sleep 1
  done
else
  echo "Warning: Docker not found. Skipping PostgreSQL container."
  echo "Make sure PostgreSQL is running and DATABASE_URL is set in backend/.env"
fi

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

PIDS=()

cleanup() {
  trap - EXIT INT TERM
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

(cd "$BACKEND_DIR" && PORT="$BACKEND_PORT" npm run dev) &
PIDS+=("$!")

(cd "$FRONTEND_DIR" && VITE_API_URL="$API_URL" npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT") &
PIDS+=("$!")

wait -n "${PIDS[@]}"
