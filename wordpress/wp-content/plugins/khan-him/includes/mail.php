<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_configure_phpmailer(PHPMailer\PHPMailer\PHPMailer $phpmailer): void
{
    $host = defined('KHAN_HIM_SMTP_HOST') ? (string) KHAN_HIM_SMTP_HOST : 'mailpit';
    $port = defined('KHAN_HIM_SMTP_PORT') ? (int) KHAN_HIM_SMTP_PORT : 1025;
    $user = defined('KHAN_HIM_SMTP_USER') ? (string) KHAN_HIM_SMTP_USER : '';
    $pass = defined('KHAN_HIM_SMTP_PASS') ? (string) KHAN_HIM_SMTP_PASS : '';
    $secure = defined('KHAN_HIM_SMTP_SECURE')
        ? strtolower(trim((string) KHAN_HIM_SMTP_SECURE))
        : '';

    $phpmailer->isSMTP();
    $phpmailer->Host = $host;
    $phpmailer->Port = $port;
    $phpmailer->SMTPAuth = $user !== '';
    if ($user !== '') {
        $phpmailer->Username = $user;
        $phpmailer->Password = $pass;
    }
    // Пусто / off — без TLS (Mailpit). tls — STARTTLS (587). ssl — SMTPS (465).
    if ($secure === 'tls' || $secure === 'ssl') {
        $phpmailer->SMTPSecure = $secure;
        $phpmailer->SMTPAutoTLS = true;
    } else {
        $phpmailer->SMTPSecure = false;
        $phpmailer->SMTPAutoTLS = false;
    }

    $from = defined('KHAN_HIM_SMTP_FROM')
        ? (string) KHAN_HIM_SMTP_FROM
        : 'Хан-Хим <noreply@example.com>';
    $from_email = 'noreply@example.com';
    $from_name = 'Хан-Хим';
    if (preg_match('/^(.*)<([^>]+)>$/u', $from, $m)) {
        $from_name = trim($m[1], " \t\"");
        $from_email = trim($m[2]);
    } elseif (is_email($from)) {
        $from_email = $from;
    }
    if (!is_email($from_email)) {
        $from_email = 'noreply@example.com';
    }
    try {
        $phpmailer->setFrom($from_email, $from_name);
    } catch (Throwable $e) {
        error_log('khan-him: setFrom failed: ' . $e->getMessage());
    }
}

/**
 * @return list<string>
 */
function khan_him_request_recipient_emails(): array
{
    $settings = khan_him_get_settings();
    $emails = [];
    foreach ($settings['request_emails'] as $email) {
        $email = sanitize_email($email);
        if ($email !== '') {
            $emails[] = $email;
        }
    }
    if ($emails === []) {
        $fallback = defined('KHAN_HIM_REQUESTS_FALLBACK_EMAIL')
            ? (string) KHAN_HIM_REQUESTS_FALLBACK_EMAIL
            : 'demo@example.com';
        $emails[] = sanitize_email($fallback);
    }
    return array_values(array_unique($emails));
}
