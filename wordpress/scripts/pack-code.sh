#!/usr/bin/env bash
# Zip темы и плагина для загрузки в чистый WordPress (сценарий A).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"

THEME_SRC="wp-content/themes/khan-him"
PLUGIN_SRC="wp-content/plugins/khan-him"
THEME_ZIP="$OUT/khan-him-theme.zip"
PLUGIN_ZIP="$OUT/khan-him-plugin.zip"

if [[ ! -f "$THEME_SRC/style.css" ]]; then
  echo "error: нет $THEME_SRC/style.css" >&2
  exit 1
fi
if [[ ! -f "$PLUGIN_SRC/khan-him.php" ]]; then
  echo "error: нет $PLUGIN_SRC/khan-him.php" >&2
  exit 1
fi

rm -f "$THEME_ZIP" "$PLUGIN_ZIP"

# Корень архива = папка темы/плагина (так ждёт «Добавить» в wp-admin).
(
  cd wp-content/themes
  zip -r -q "$THEME_ZIP" khan-him \
    -x '*/.DS_Store' '*/.git/*' '*/node_modules/*'
)
(
  cd wp-content/plugins
  zip -r -q "$PLUGIN_ZIP" khan-him \
    -x '*/.DS_Store' '*/.git/*' '*/node_modules/*'
)

echo "Theme:  $THEME_ZIP ($(du -h "$THEME_ZIP" | cut -f1))"
echo "Plugin: $PLUGIN_ZIP ($(du -h "$PLUGIN_ZIP" | cut -f1))"
echo "Дальше: wp-admin → Внешний вид / Плагины → Загрузить."
