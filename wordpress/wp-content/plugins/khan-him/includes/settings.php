<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @return array{
 *   company_name:string, phone:string, email:string, address:string,
 *   inn:string, ogrn:string, kpp:string, legal_address:string,
 *   request_emails:list<string>
 * }
 */
function khan_him_get_settings(): array
{
    $defaults = [
        'company_name' => 'Хан-Хим',
        'phone' => '',
        'email' => '',
        'address' => '',
        'inn' => '',
        'ogrn' => '',
        'kpp' => '',
        'legal_address' => '',
        'request_emails' => [],
    ];
    $stored = get_option('khan_him_site_settings', []);
    if (!is_array($stored)) {
        $stored = [];
    }
    $out = array_merge($defaults, $stored);
    if (!is_array($out['request_emails'])) {
        $out['request_emails'] = [];
    }
    $out['request_emails'] = array_values(array_filter(array_map('strval', $out['request_emails'])));
    return $out;
}

function khan_him_admin_menu(): void
{
    add_menu_page(
        'Настройки сайта',
        'Настройки сайта',
        'manage_options',
        'khan-him-settings',
        'khan_him_render_settings_page',
        'dashicons-admin-generic',
        58
    );
}

function khan_him_admin_init(): void
{
    register_setting('khan_him_settings', 'khan_him_site_settings', [
        'type' => 'array',
        'sanitize_callback' => 'khan_him_sanitize_settings',
        'default' => [],
    ]);
}

/**
 * @param mixed $input
 * @return array<string, mixed>
 */
function khan_him_sanitize_settings($input): array
{
    $input = is_array($input) ? $input : [];
    $emails_raw = (string) ($input['request_emails'] ?? '');
    $emails = array_values(array_filter(array_map(
        static fn ($e) => sanitize_email(trim($e)),
        preg_split('/\r\n|\r|\n|,/', $emails_raw) ?: []
    )));

    return [
        'company_name' => sanitize_text_field((string) ($input['company_name'] ?? 'Хан-Хим')),
        'phone' => sanitize_text_field((string) ($input['phone'] ?? '')),
        'email' => sanitize_email((string) ($input['email'] ?? '')),
        'address' => sanitize_textarea_field((string) ($input['address'] ?? '')),
        'inn' => sanitize_text_field((string) ($input['inn'] ?? '')),
        'ogrn' => sanitize_text_field((string) ($input['ogrn'] ?? '')),
        'kpp' => sanitize_text_field((string) ($input['kpp'] ?? '')),
        'legal_address' => sanitize_textarea_field((string) ($input['legal_address'] ?? '')),
        'request_emails' => $emails,
    ];
}

function khan_him_render_settings_page(): void
{
    if (!current_user_can('manage_options')) {
        return;
    }
    $s = khan_him_get_settings();
    ?>
    <div class="wrap">
        <h1>Настройки сайта</h1>
        <form method="post" action="options.php">
            <?php settings_fields('khan_him_settings'); ?>
            <table class="form-table" role="presentation">
                <tr><th>Название компании</th><td><input class="regular-text" name="khan_him_site_settings[company_name]" value="<?php echo esc_attr($s['company_name']); ?>"></td></tr>
                <tr><th>Телефон</th><td><input class="regular-text" name="khan_him_site_settings[phone]" value="<?php echo esc_attr($s['phone']); ?>"></td></tr>
                <tr><th>Email</th><td><input class="regular-text" type="email" name="khan_him_site_settings[email]" value="<?php echo esc_attr($s['email']); ?>"></td></tr>
                <tr><th>Адрес</th><td><textarea class="large-text" name="khan_him_site_settings[address]" rows="3"><?php echo esc_textarea($s['address']); ?></textarea></td></tr>
                <tr><th>ИНН</th><td><input class="regular-text" name="khan_him_site_settings[inn]" value="<?php echo esc_attr($s['inn']); ?>"></td></tr>
                <tr><th>ОГРН</th><td><input class="regular-text" name="khan_him_site_settings[ogrn]" value="<?php echo esc_attr($s['ogrn']); ?>"></td></tr>
                <tr><th>КПП</th><td><input class="regular-text" name="khan_him_site_settings[kpp]" value="<?php echo esc_attr($s['kpp']); ?>"></td></tr>
                <tr><th>Юридический адрес</th><td><textarea class="large-text" name="khan_him_site_settings[legal_address]" rows="3"><?php echo esc_textarea($s['legal_address']); ?></textarea></td></tr>
                <tr><th>Адреса для заявок</th><td>
                    <textarea class="large-text" name="khan_him_site_settings[request_emails]" rows="4" placeholder="по одному на строку"><?php echo esc_textarea(implode("\n", $s['request_emails'])); ?></textarea>
                    <p class="description">Если пусто — используется резервный адрес из конфигурации сервера.</p>
                </td></tr>
            </table>
            <?php submit_button('Сохранить'); ?>
        </form>
    </div>
    <?php
}
