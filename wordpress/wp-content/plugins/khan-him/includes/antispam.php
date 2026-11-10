<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

const KHAN_HIM_MIN_FORM_MS = 3000;
const KHAN_HIM_RATE_WINDOW = 600;
const KHAN_HIM_RATE_MAX = 5;

function khan_him_check_honeypot(string $value): ?string
{
    if (trim($value) !== '') {
        return 'Отклонено';
    }
    return null;
}

function khan_him_check_form_timing(int $form_opened_at, ?int $now = null): ?string
{
    $now ??= (int) round(microtime(true) * 1000);
    if ($form_opened_at <= 0 || ($now - $form_opened_at) < KHAN_HIM_MIN_FORM_MS) {
        return 'Отправьте форму чуть позже';
    }
    return null;
}

/**
 * @return list<int>
 */
function khan_him_rate_limit_hits(string $ip, ?int $now = null): array
{
    $now ??= time();
    $key = 'khan_him_rl_' . md5($ip !== '' ? $ip : 'unknown');
    $recent = get_transient($key);
    if (!is_array($recent)) {
        $recent = [];
    }
    return array_values(array_filter(
        array_map('intval', $recent),
        static fn (int $ts): bool => ($now - $ts) < KHAN_HIM_RATE_WINDOW
    ));
}

function khan_him_check_rate_limit(string $ip, ?int $now = null): ?string
{
    $now ??= time();
    $recent = khan_him_rate_limit_hits($ip, $now);
    if (count($recent) >= KHAN_HIM_RATE_MAX) {
        return 'Слишком много заявок. Попробуйте позже';
    }
    return null;
}

function khan_him_record_rate_limit(string $ip, ?int $now = null): void
{
    $now ??= time();
    $key = 'khan_him_rl_' . md5($ip !== '' ? $ip : 'unknown');
    $recent = khan_him_rate_limit_hits($ip, $now);
    $recent[] = $now;
    set_transient($key, $recent, KHAN_HIM_RATE_WINDOW);
}

function khan_him_client_ip(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return is_string($ip) ? $ip : '';
}
