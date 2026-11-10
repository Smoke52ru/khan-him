<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_handle_request_submit(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        return;
    }
    if (!isset($_POST['khan_him_request'])) {
        return;
    }

    $redirect = wp_get_referer() ?: home_url('/');
    $nonce = isset($_POST['khan_him_request_nonce']) ? (string) $_POST['khan_him_request_nonce'] : '';
    if (!wp_verify_nonce($nonce, 'khan_him_submit_request')) {
        khan_him_request_flash($redirect, 'error', 'Сессия истекла. Отправьте форму ещё раз.');
    }

    $honeypot = isset($_POST['website']) ? (string) wp_unslash($_POST['website']) : '';
    if ($err = khan_him_check_honeypot($honeypot)) {
        khan_him_request_flash($redirect, 'error', $err);
    }

    $opened = isset($_POST['form_opened_at']) ? (int) $_POST['form_opened_at'] : 0;
    if ($err = khan_him_check_form_timing($opened)) {
        khan_him_request_flash($redirect, 'error', $err);
    }

    if ($err = khan_him_check_rate_limit(khan_him_client_ip())) {
        khan_him_request_flash($redirect, 'error', $err);
    }

    $name = trim(sanitize_text_field((string) wp_unslash($_POST['name'] ?? '')));
    $phone = trim(sanitize_text_field((string) wp_unslash($_POST['phone'] ?? '')));
    $email_raw = trim((string) wp_unslash($_POST['email'] ?? ''));
    $email = $email_raw === '' ? '' : sanitize_email($email_raw);
    $message = trim(sanitize_textarea_field((string) wp_unslash($_POST['message'] ?? '')));
    $source = sanitize_text_field((string) wp_unslash($_POST['source'] ?? 'quick'));
    if (!in_array($source, ['list', 'quick', 'price'], true)) {
        $source = 'quick';
    }
    $privacy = !empty($_POST['privacy_consent']);
    $pd = !empty($_POST['pd_consent']);

    $items_in = isset($_POST['items']) && is_array($_POST['items']) ? wp_unslash($_POST['items']) : [];
    $items = [];
    foreach ($items_in as $row) {
        if (!is_array($row)) {
            continue;
        }
        $product_name = sanitize_text_field((string) ($row['name'] ?? ''));
        if ($product_name === '') {
            continue;
        }
        $items[] = [
            'productId' => sanitize_text_field((string) ($row['productId'] ?? '')),
            'name' => $product_name,
            'sku' => sanitize_text_field((string) ($row['sku'] ?? '')),
            'quantity' => sanitize_text_field((string) ($row['quantity'] ?? '')),
        ];
    }

    $field_errors = [];
    if ($name === '') {
        $field_errors['name'] = 'Укажите имя';
    }
    if ($phone === '' || mb_strlen($phone) < 5) {
        $field_errors['phone'] = 'Укажите телефон';
    }
    if ($email_raw !== '' && !is_email($email)) {
        $field_errors['email'] = 'Некорректный email';
    }
    if ($items === [] && $message === '') {
        $field_errors['message'] = 'Добавьте товар или опишите запрос в комментарии';
    }
    if (!$privacy) {
        $field_errors['privacy_consent'] = 'Нужно согласие с политикой конфиденциальности';
    }
    if (!$pd) {
        $field_errors['pd_consent'] = 'Нужно согласие на обработку персональных данных';
    }

    if ($field_errors !== []) {
        set_transient('khan_him_form_' . khan_him_form_token(), [
            'errors' => $field_errors,
            'values' => compact('name', 'phone', 'email', 'message', 'source', 'items'),
        ], 120);
        wp_safe_redirect(add_query_arg('request_error', '1', $redirect));
        exit;
    }

    $now = current_time('mysql');
    $title = sprintf('Заявка от %s — %s', $name, wp_date('d.m.Y H:i'));
    $request_id = wp_insert_post([
        'post_type' => 'request',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_content' => '',
    ], true);

    if (is_wp_error($request_id) || !$request_id) {
        khan_him_request_flash($redirect, 'error', 'Не удалось сохранить заявку. Позвоните нам.');
    }

    $request_id = (int) $request_id;
    update_post_meta($request_id, 'khan_him_name', $name);
    update_post_meta($request_id, 'khan_him_phone', $phone);
    update_post_meta($request_id, 'khan_him_email', $email);
    update_post_meta($request_id, 'khan_him_message', $message);
    update_post_meta($request_id, 'khan_him_source', $source);
    update_post_meta($request_id, 'khan_him_items', $items);
    update_post_meta($request_id, 'khan_him_privacy_consent_at', $now);
    update_post_meta($request_id, 'khan_him_pd_consent_at', $now);
    update_post_meta($request_id, 'khan_him_ip', khan_him_client_ip());

    khan_him_record_rate_limit(khan_him_client_ip());
    khan_him_send_request_email($request_id);

    $ok = add_query_arg([
        'request_sent' => '1',
        'clear_request_list' => $source === 'list' ? '1' : '0',
    ], home_url('/request/'));
    wp_safe_redirect($ok);
    exit;
}

function khan_him_form_token(): string
{
    return substr(hash('sha256', khan_him_client_ip() . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 16);
}

/**
 * @return array{errors:array<string,string>,values:array<string,mixed>}|null
 */
function khan_him_consume_form_flash(): ?array
{
    $key = 'khan_him_form_' . khan_him_form_token();
    $data = get_transient($key);
    delete_transient($key);
    return is_array($data) ? $data : null;
}

function khan_him_request_flash(string $redirect, string $type, string $message): void
{
    set_transient('khan_him_notice_' . khan_him_form_token(), ['type' => $type, 'message' => $message], 120);
    wp_safe_redirect(add_query_arg('request_notice', '1', $redirect));
    exit;
}

/**
 * @return array{type:string,message:string}|null
 */
function khan_him_consume_notice(): ?array
{
    $key = 'khan_him_notice_' . khan_him_form_token();
    $data = get_transient($key);
    delete_transient($key);
    return is_array($data) ? $data : null;
}

function khan_him_send_request_email(int $request_id): void
{
    $recipients = khan_him_request_recipient_emails();
    $name = (string) get_post_meta($request_id, 'khan_him_name', true);
    $phone = (string) get_post_meta($request_id, 'khan_him_phone', true);
    $email = (string) get_post_meta($request_id, 'khan_him_email', true);
    $message = (string) get_post_meta($request_id, 'khan_him_message', true);
    $items = get_post_meta($request_id, 'khan_him_items', true);
    if (!is_array($items)) {
        $items = [];
    }

    $lines = [
        "Новая заявка #{$request_id}",
        "Имя: {$name}",
        "Телефон: {$phone}",
        'Email: ' . ($email !== '' ? $email : '—'),
        'Сообщение: ' . ($message !== '' ? $message : '—'),
        'Позиции:',
    ];
    if ($items === []) {
        $lines[] = '  (без товаров)';
    } else {
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $lines[] = sprintf(
                '  - %s%s%s',
                (string) ($item['name'] ?? ''),
                !empty($item['sku']) ? ' [' . $item['sku'] . ']' : '',
                !empty($item['quantity']) ? ' — ' . $item['quantity'] : ''
            );
        }
    }
    $admin_link = admin_url('post.php?post=' . $request_id . '&action=edit');
    $lines[] = '';
    $lines[] = 'Открыть в админке: ' . $admin_link;

    $headers = ['Content-Type: text/plain; charset=UTF-8'];
    if ($email !== '' && is_email($email)) {
        $headers[] = 'Reply-To: ' . $email;
    }

    try {
        $ok = wp_mail($recipients, 'Заявка с сайта Хан-Хим #' . $request_id, implode("\n", $lines), $headers);
    } catch (Throwable $e) {
        $ok = false;
        error_log('Failed to send request email for request ' . $request_id . ': ' . $e->getMessage());
    }
    if (!$ok) {
        error_log('Failed to send request email for request ' . $request_id);
    }
}
