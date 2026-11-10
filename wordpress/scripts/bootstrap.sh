#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

# shellcheck disable=SC1091
source .env

echo "Installing WordPress (if needed)..."
docker compose run --rm --entrypoint bash wpcli -lc '
set -e
if ! wp core is-installed --allow-root 2>/dev/null; then
  wp core install \
    --url="http://127.0.0.1:3000" \
    --title="Хан-Хим" \
    --admin_user="'"${ADMIN_USER:-admin}"'" \
    --admin_password="'"${ADMIN_PASSWORD:-admin-change-me}"'" \
    --admin_email="'"${ADMIN_EMAIL:-admin@example.com}"'" \
    --skip-email \
    --allow-root
fi
wp language core install ru_RU --activate --allow-root || true
wp option update WPLANG ru_RU --allow-root
wp rewrite structure "/%postname%/" --allow-root
wp plugin activate khan-him --allow-root
wp theme activate khan-him --allow-root
wp option update users_can_register 0 --allow-root
'

echo "Seeding..."
RESET_FLAG="${1:-}"
if [[ "$RESET_FLAG" == "--reset" ]]; then
  docker compose run --rm -e KHAN_HIM_SEED_RESET=1 \
    -e ADMIN_USER="${ADMIN_USER:-admin}" \
    -e ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}" \
    -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin-change-me}" \
    -e REQUESTS_FALLBACK_EMAIL="${REQUESTS_FALLBACK_EMAIL:-demo@example.com}" \
    --entrypoint wp wpcli eval-file /scripts/seed.php --allow-root
else
  docker compose run --rm \
    -e ADMIN_USER="${ADMIN_USER:-admin}" \
    -e ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}" \
    -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin-change-me}" \
    -e REQUESTS_FALLBACK_EMAIL="${REQUESTS_FALLBACK_EMAIL:-demo@example.com}" \
    --entrypoint wp wpcli eval-file /scripts/seed.php --allow-root
fi

echo "Done. Site: http://127.0.0.1:3000  Admin: http://127.0.0.1:3000/wp-admin  Mailpit: http://127.0.0.1:8025"
