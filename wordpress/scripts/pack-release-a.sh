#!/usr/bin/env bash
# Сценарий A: zip темы/плагина + пакет сида + шпаргалка SMTP.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M)"
OUT="${1:-dist/release-a-$STAMP}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

"$ROOT/scripts/pack-code.sh" "$OUT"
"$ROOT/scripts/pack-seed.sh" "$OUT"
"$ROOT/scripts/print-wp-config-smtp.sh" > "$OUT/wp-config-smtp.snippet.php"
chmod 600 "$OUT/wp-config-smtp.snippet.php" 2>/dev/null || true

cat > "$OUT/CHECKLIST.md" << EOF
# Выкладка WordPress на Рег.ру (сценарий A)

Собрано: $STAMP

## Файлы в этой папке

| Файл | Куда |
|---|---|
| \`khan-him-theme.zip\` | wp-admin → Внешний вид → Тема → Загрузить |
| \`khan-him-plugin.zip\` | wp-admin → Плагины → Добавить → Загрузить |
| \`khan-him-seed.tar.gz\` | на сервер, если есть WP-CLI (см. README внутри) |
| \`wp-config-smtp.snippet.php\` | скопировать defines в \`wp-config.php\` (пароль проверить!) |

## Порядок

1. Чистый WordPress на хостинге, HTTPS, адрес сайта \`https://smoke52.ru\`.
2. Загрузить и активировать плагин, затем тему.
3. Постоянные ссылки: «Название записи».
4. Почта: ящик + фрагмент SMTP в \`wp-config.php\` (\`KHAN_HIM_SMTP_SECURE=tls\` для порта 587).
5. Сид: \`wp eval-file …/khan-him-seed/scripts/seed.php\` **или** каталог вручную.
6. Адреса для заявок в настройках Хан-Хим; тестовая заявка.

Подробнее: \`HOSTING.md\` → «План: WordPress на хостинге Рег.ру».
EOF

echo
echo "Release A: $OUT"
ls -lh "$OUT"
