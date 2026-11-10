#!/usr/bin/env bash
# Деплой тестового стека на VPS: сборка образа локально → архив → load на сервере.
# Compose: docker-compose.vps-ip.yml (HTTP по IP). На сервере уже должен быть .env.
#
# Пример:
#   ./scripts/deploy-vps-ip.sh --host 176.53.226.13
#   ./scripts/deploy-vps-ip.sh --host 176.53.226.13 --prune --seed
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HOST="${DEPLOY_VPS_HOST:-}"
USER="${DEPLOY_VPS_USER:-root}"
REMOTE_DIR="${DEPLOY_VPS_DIR:-/opt/khan-him}"
COMPOSE_FILE="docker-compose.vps-ip.yml"
IMAGE="khan-him:latest"
PLATFORM="linux/amd64"
DO_BUILD=1
DO_PRUNE=0
DO_SEED=0
KEEP_ARCHIVE=0

usage() {
  cat <<'EOF'
Usage: scripts/deploy-vps-ip.sh --host <IP|hostname> [options]

Build khan-him:latest locally, ship it as a gzipped docker save archive,
load on the VPS, and recreate app/caddy without building on the server.

Required:
  --host <addr>          VPS address (or set DEPLOY_VPS_HOST)

Options:
  --user <name>          SSH user (default: root, or DEPLOY_VPS_USER)
  --dir <path>           Remote project dir (default: /opt/khan-him)
  --platform <plat>      docker build --platform (default: linux/amd64)
  --no-build             Skip docker build; save existing local image
  --prune                On VPS: prune builder cache and unused images
                         (does not remove volumes / db-data / uploads)
  --seed                 After up: docker compose exec app pnpm seed
  --keep-archive         Keep local /tmp archive after upload
  -h, --help             Show this help

Env: DEPLOY_VPS_HOST, DEPLOY_VPS_USER, DEPLOY_VPS_DIR
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:?--host needs a value}"
      shift 2
      ;;
    --user)
      USER="${2:?--user needs a value}"
      shift 2
      ;;
    --dir)
      REMOTE_DIR="${2:?--dir needs a value}"
      shift 2
      ;;
    --platform)
      PLATFORM="${2:?--platform needs a value}"
      shift 2
      ;;
    --no-build)
      DO_BUILD=0
      shift
      ;;
    --prune)
      DO_PRUNE=1
      shift
      ;;
    --seed)
      DO_SEED=1
      shift
      ;;
    --keep-archive)
      KEEP_ARCHIVE=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "Error: --host is required (or set DEPLOY_VPS_HOST)." >&2
  usage >&2
  exit 1
fi

for f in "$COMPOSE_FILE" Caddyfile.ip Dockerfile; do
  if [[ ! -f "$f" ]]; then
    echo "Error: missing $f in $ROOT" >&2
    exit 1
  fi
done

SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${USER}@${HOST}")
SCP=(scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

echo "==> Target ${USER}@${HOST}:${REMOTE_DIR}"
echo "==> Compose ${COMPOSE_FILE}, image ${IMAGE}, platform ${PLATFORM}"

# Docker COPY сохраняет mode. Файлы 0600 (часто pnpm-workspace.yaml) в образе
# принадлежат root, а контейнер работает как nextjs → pnpm seed падает с
# Permission denied. Делаем конфиги читаемыми до сборки.
echo "==> Ensuring build context configs are world-readable"
chmod a+r package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json

if [[ "$DO_BUILD" -eq 1 ]]; then
  echo "==> Building ${IMAGE}"
  docker build --platform "$PLATFORM" -t "$IMAGE" .
else
  echo "==> Skipping build (--no-build)"
  if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
    echo "Error: local image ${IMAGE} not found" >&2
    exit 1
  fi
fi

ARCHIVE="$(mktemp "${TMPDIR:-/tmp}/khan-him.XXXXXX.tar.gz")"
cleanup_local() {
  if [[ "$KEEP_ARCHIVE" -eq 0 ]]; then
    rm -f "$ARCHIVE"
  else
    echo "==> Local archive kept: $ARCHIVE"
  fi
}
trap cleanup_local EXIT

echo "==> Saving ${IMAGE} -> ${ARCHIVE}"
docker save "$IMAGE" | gzip >"$ARCHIVE"
ls -lh "$ARCHIVE"

echo "==> Ensuring remote dir exists"
"${SSH[@]}" "mkdir -p '${REMOTE_DIR}'"

echo "==> Uploading compose + Caddyfile.ip (does not overwrite .env)"
"${SCP[@]}" "$COMPOSE_FILE" Caddyfile.ip "${USER}@${HOST}:${REMOTE_DIR}/"

REMOTE_ARCHIVE="${REMOTE_DIR}/khan-him.tar.gz"
echo "==> Uploading image archive"
"${SCP[@]}" "$ARCHIVE" "${USER}@${HOST}:${REMOTE_ARCHIVE}"

echo "==> Loading image and recreating containers on VPS"
# shellcheck disable=SC2029
"${SSH[@]}" "set -euo pipefail
  cd '${REMOTE_DIR}'
  if [[ ! -f .env ]]; then
    echo 'Error: ${REMOTE_DIR}/.env missing. Create it from .env.example first.' >&2
    exit 1
  fi
  if [[ '${DO_PRUNE}' -eq 1 ]]; then
    echo '==> Prune before load (builder + dangling images)'
    docker builder prune -af
    docker image prune -f
  fi
  echo '==> docker load'
  gunzip -c '${REMOTE_ARCHIVE}' | docker load
  rm -f '${REMOTE_ARCHIVE}'
  echo '==> compose up (no --build)'
  docker compose -f '${COMPOSE_FILE}' up -d --force-recreate app caddy
  docker compose -f '${COMPOSE_FILE}' ps
  # На уже собранных образах с 0600-конфигами чиним права до seed/exec.
  echo '==> Fix readable configs for nextjs user (pnpm seed)'
  docker compose -f '${COMPOSE_FILE}' exec -T -u root app \
    chmod a+r /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.json
  if [[ '${DO_SEED}' -eq 1 ]]; then
    echo '==> pnpm seed'
    docker compose -f '${COMPOSE_FILE}' exec -T app pnpm seed
  fi
  if [[ '${DO_PRUNE}' -eq 1 ]]; then
    echo '==> Prune after deploy (builder + unused images; volumes kept)'
    docker builder prune -af
    docker image prune -af
    docker system df
  fi
"

echo "==> Done. Site: http://${HOST}/  Admin: http://${HOST}/admin"
