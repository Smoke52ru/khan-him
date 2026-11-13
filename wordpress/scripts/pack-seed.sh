#!/usr/bin/env bash
# Пакет сида для WP-CLI на хостинге (сценарий A, если CLI доступен).
# Распаковать рядом с корнем WP или в /tmp, затем:
#   wp eval-file /path/to/khan-him-seed/scripts/seed.php
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

BUNDLE="$STAGING/khan-him-seed"
mkdir -p "$BUNDLE/scripts" "$BUNDLE/seed"

cp scripts/seed.php "$BUNDLE/scripts/seed.php"
cp -a seed/. "$BUNDLE/seed/"

# Краткая шпаргалка внутри архива (без секретов).
cat > "$BUNDLE/README.txt" << 'EOF'
Сид Хан-Хим для WP-CLI на хостинге
===================================

1. Распакуйте этот каталог на сервер (например в ~/khan-him-seed).
2. Тема и плагин khan-him уже должны быть активны.
3. Из каталога WordPress (где wp-config.php):

   wp eval-file /полный/путь/khan-him-seed/scripts/seed.php

   Сброс каталога и повторный сид:

   KHAN_HIM_SEED_RESET=1 wp eval-file /полный/путь/khan-him-seed/scripts/seed.php

4. Путь к данным: рядом со scripts/ лежит seed/.
   Или задайте KHAN_HIM_SEED_DIR=/полный/путь/khan-him-seed/seed

5. Опционально окружение админа/почты заявок:
   ADMIN_USER ADMIN_EMAIL ADMIN_PASSWORD REQUESTS_FALLBACK_EMAIL

Если WP-CLI нет — каталог набивайте вручную в админке; этот архив не нужен.
EOF

TAR="$OUT/khan-him-seed.tar.gz"
rm -f "$TAR"
tar -C "$STAGING" -czf "$TAR" khan-him-seed

echo "Seed: $TAR ($(du -h "$TAR" | cut -f1))"
echo "На хостинге: см. README.txt внутри архива."
