#!/usr/bin/env bash
# Печатает фрагмент define() для wp-config.php (сценарий Рег.ру).
# Значения из аргументов или wordpress/.env; пароль не пишется в файлы репо.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

HOST="${SMTP_HOST:-mail.hosting.reg.ru}"
PORT="${SMTP_PORT:-587}"
USER="${SMTP_USER:-noreply@smoke52.ru}"
PASS="${SMTP_PASS:-пароль-ящика}"
SECURE="${SMTP_SECURE:-tls}"
FROM="${SMTP_FROM:-Хан-Хим <noreply@smoke52.ru>}"
FALLBACK="${REQUESTS_FALLBACK_EMAIL:-ваш-ящик@gmail.com}"

# Экранирование одиночных кавычек для PHP-строк.
php_str() {
  printf "%s" "${1//\'/\\\'}"
}

cat << EOF
/* SMTP Хан-Хим — вставить в wp-config.php до «That's all, stop editing!» */
define('KHAN_HIM_SMTP_HOST', '$(php_str "$HOST")');
define('KHAN_HIM_SMTP_PORT', $(php_str "$PORT"));
define('KHAN_HIM_SMTP_USER', '$(php_str "$USER")');
define('KHAN_HIM_SMTP_PASS', '$(php_str "$PASS")');
define('KHAN_HIM_SMTP_SECURE', '$(php_str "$SECURE")'); // tls | ssl | пусто
define('KHAN_HIM_SMTP_FROM', '$(php_str "$FROM")');
define('KHAN_HIM_REQUESTS_FALLBACK_EMAIL', '$(php_str "$FALLBACK")');
EOF
