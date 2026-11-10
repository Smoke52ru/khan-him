<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_register_meta(): void
{
    $string_keys = [
        'sku', 'formula', 'cas', 'gost', 'tu', 'packaging', 'availability',
        'application', 'storage', 'transport', 'safety',
    ];
    foreach ($string_keys as $key) {
        register_post_meta('product', "khan_him_{$key}", [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => false,
            'auth_callback' => static fn () => current_user_can('edit_posts'),
        ]);
    }
}

add_action('add_meta_boxes', static function (): void {
    add_meta_box(
        'khan_him_product_fields',
        'Поля товара',
        'khan_him_render_product_metabox',
        'product',
        'normal',
        'high'
    );
    add_meta_box(
        'khan_him_product_specs',
        'Технические характеристики',
        'khan_him_render_specs_metabox',
        'product',
        'normal',
        'default'
    );
    add_meta_box(
        'khan_him_product_gallery',
        'Галерея',
        'khan_him_render_gallery_metabox',
        'product',
        'side',
        'default'
    );
    add_meta_box(
        'khan_him_product_documents',
        'Документы',
        'khan_him_render_documents_metabox',
        'product',
        'side',
        'default'
    );
    add_meta_box(
        'khan_him_request_readonly',
        'Данные заявки',
        'khan_him_render_request_metabox',
        'request',
        'normal',
        'high'
    );
});

function khan_him_product_meta(int $post_id, string $key, string $default = ''): string
{
    $value = get_post_meta($post_id, "khan_him_{$key}", true);
    return is_string($value) ? $value : $default;
}

/**
 * @return list<string>
 */
function khan_him_product_alt_names(int $post_id): array
{
    $raw = get_post_meta($post_id, 'khan_him_alt_names', true);
    if (!is_array($raw)) {
        return [];
    }
    return array_values(array_filter(array_map('strval', $raw), static fn ($v) => $v !== ''));
}

/**
 * @return list<array{name:string,value:string}>
 */
function khan_him_product_specs(int $post_id): array
{
    $raw = get_post_meta($post_id, 'khan_him_specs', true);
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $row) {
        if (!is_array($row)) {
            continue;
        }
        $name = trim((string) ($row['name'] ?? ''));
        $value = trim((string) ($row['value'] ?? ''));
        if ($name === '' || $value === '') {
            continue;
        }
        $out[] = ['name' => $name, 'value' => $value];
    }
    return $out;
}

/**
 * @return list<int>
 */
function khan_him_product_gallery_ids(int $post_id): array
{
    $raw = get_post_meta($post_id, 'khan_him_gallery', true);
    if (!is_array($raw)) {
        return [];
    }
    return array_values(array_filter(array_map('intval', $raw), static fn ($id) => $id > 0));
}

/**
 * @return list<array{id:int,title:string}>
 */
function khan_him_product_documents(int $post_id): array
{
    $raw = get_post_meta($post_id, 'khan_him_documents', true);
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach ($raw as $row) {
        if (!is_array($row)) {
            continue;
        }
        $id = (int) ($row['id'] ?? 0);
        $title = trim((string) ($row['title'] ?? ''));
        if ($id <= 0) {
            continue;
        }
        $out[] = ['id' => $id, 'title' => $title !== '' ? $title : get_the_title($id)];
    }
    return $out;
}

function khan_him_render_product_metabox(WP_Post $post): void
{
    wp_nonce_field('khan_him_save_product', 'khan_him_product_nonce');
    $alt = implode("\n", khan_him_product_alt_names($post->ID));
    $availability = khan_him_product_meta($post->ID, 'availability', 'stock');
    $fields = [
        'sku' => 'Артикул',
        'formula' => 'Химическая формула',
        'cas' => 'Номер CAS',
        'gost' => 'ГОСТ',
        'tu' => 'ТУ',
        'packaging' => 'Фасовка',
    ];
    ?>
    <p><label>Альтернативные названия<br>
        <textarea name="khan_him_alt_names" rows="3" class="large-text" placeholder="По одному на строку"><?php echo esc_textarea($alt); ?></textarea>
    </label></p>
    <div class="khan-him-grid">
        <?php foreach ($fields as $key => $label) : ?>
            <p><label><?php echo esc_html($label); ?><br>
                <input type="text" class="widefat" name="khan_him_<?php echo esc_attr($key); ?>"
                       value="<?php echo esc_attr(khan_him_product_meta($post->ID, $key)); ?>">
            </label></p>
        <?php endforeach; ?>
        <p><label>Наличие<br>
            <select name="khan_him_availability">
                <option value="stock" <?php selected($availability, 'stock'); ?>>На складе</option>
                <option value="order" <?php selected($availability, 'order'); ?>>Под заказ</option>
            </select>
        </label></p>
    </div>
    <?php
    $long = [
        'application' => 'Применение',
        'storage' => 'Хранение',
        'transport' => 'Транспортировка',
        'safety' => 'Техника безопасности',
    ];
    foreach ($long as $key => $label) {
        echo '<p><label>' . esc_html($label) . '<br>';
        wp_editor(
            khan_him_product_meta($post->ID, $key),
            'khan_him_' . $key,
            [
                'textarea_name' => 'khan_him_' . $key,
                'textarea_rows' => 5,
                'media_buttons' => false,
                'teeny' => true,
            ]
        );
        echo '</label></p>';
    }
}

function khan_him_render_specs_metabox(WP_Post $post): void
{
    $specs = khan_him_product_specs($post->ID);
    if ($specs === []) {
        $specs = [['name' => '', 'value' => '']];
    }
    ?>
    <div id="khan-him-specs">
        <?php foreach ($specs as $i => $row) : ?>
            <p class="khan-him-spec-row">
                <input type="text" name="khan_him_specs[<?php echo (int) $i; ?>][name]" placeholder="Показатель"
                       value="<?php echo esc_attr($row['name']); ?>">
                <input type="text" name="khan_him_specs[<?php echo (int) $i; ?>][value]" placeholder="Значение"
                       value="<?php echo esc_attr($row['value']); ?>">
            </p>
        <?php endforeach; ?>
    </div>
    <p><button type="button" class="button" id="khan-him-add-spec">Добавить показатель</button></p>
    <?php
}

function khan_him_render_gallery_metabox(WP_Post $post): void
{
    $ids = khan_him_product_gallery_ids($post->ID);
    ?>
    <div id="khan-him-gallery" data-ids="<?php echo esc_attr(wp_json_encode($ids)); ?>">
        <ul class="khan-him-gallery-list">
            <?php foreach ($ids as $id) : ?>
                <li data-id="<?php echo (int) $id; ?>">
                    <?php echo wp_get_attachment_image($id, 'thumbnail'); ?>
                </li>
            <?php endforeach; ?>
        </ul>
        <input type="hidden" name="khan_him_gallery" id="khan_him_gallery_input"
               value="<?php echo esc_attr(implode(',', $ids)); ?>">
        <p>
            <button type="button" class="button" id="khan-him-gallery-pick">Выбрать фото</button>
            <button type="button" class="button" id="khan-him-gallery-clear">Очистить</button>
        </p>
        <p class="description">JPEG, PNG или WebP до 10 МБ. Первое фото — обложка.</p>
    </div>
    <?php
}

function khan_him_render_documents_metabox(WP_Post $post): void
{
    $docs = khan_him_product_documents($post->ID);
    ?>
    <div id="khan-him-documents">
        <ul class="khan-him-docs-list">
            <?php foreach ($docs as $i => $doc) : ?>
                <li>
                    <input type="hidden" name="khan_him_documents[<?php echo (int) $i; ?>][id]" value="<?php echo (int) $doc['id']; ?>">
                    <input type="text" name="khan_him_documents[<?php echo (int) $i; ?>][title]"
                           value="<?php echo esc_attr($doc['title']); ?>" placeholder="Название документа" class="widefat">
                    <span><?php echo esc_html(basename((string) get_attached_file($doc['id']))); ?></span>
                </li>
            <?php endforeach; ?>
        </ul>
        <p><button type="button" class="button" id="khan-him-docs-pick">Прикрепить документ</button></p>
        <p class="description">PDF, DOC, DOCX, XLS, XLSX до 20 МБ.</p>
    </div>
    <?php
}

function khan_him_render_request_metabox(WP_Post $post): void
{
    $keys = [
        'name' => 'Имя',
        'phone' => 'Телефон',
        'email' => 'Email',
        'message' => 'Сообщение',
        'source' => 'Источник',
        'privacy_consent_at' => 'Согласие с политикой',
        'pd_consent_at' => 'Согласие на ПДн',
        'ip' => 'IP',
    ];
    echo '<table class="widefat striped"><tbody>';
    foreach ($keys as $key => $label) {
        $value = get_post_meta($post->ID, "khan_him_{$key}", true);
        echo '<tr><th style="width:30%">' . esc_html($label) . '</th><td>' . esc_html((string) $value) . '</td></tr>';
    }
    $items = get_post_meta($post->ID, 'khan_him_items', true);
    echo '<tr><th>Позиции</th><td><pre style="white-space:pre-wrap">';
    echo esc_html(is_string($items) ? $items : wp_json_encode($items, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    echo '</pre></td></tr></tbody></table>';
    echo '<p class="description">Содержимое заявки нельзя изменить.</p>';
}

add_action('save_post_product', static function (int $post_id, WP_Post $post, bool $update): void {
    if (!isset($_POST['khan_him_product_nonce']) || !wp_verify_nonce((string) $_POST['khan_him_product_nonce'], 'khan_him_save_product')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $text_keys = ['sku', 'formula', 'cas', 'gost', 'tu', 'packaging', 'availability', 'application', 'storage', 'transport', 'safety'];
    foreach ($text_keys as $key) {
        $raw = isset($_POST["khan_him_{$key}"]) ? wp_unslash($_POST["khan_him_{$key}"]) : '';
        if (in_array($key, ['application', 'storage', 'transport', 'safety'], true)) {
            update_post_meta($post_id, "khan_him_{$key}", wp_kses_post((string) $raw));
        } else {
            update_post_meta($post_id, "khan_him_{$key}", sanitize_text_field((string) $raw));
        }
    }

    $alt_raw = isset($_POST['khan_him_alt_names']) ? (string) wp_unslash($_POST['khan_him_alt_names']) : '';
    $alt = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $alt_raw) ?: [])));
    update_post_meta($post_id, 'khan_him_alt_names', $alt);

    $specs_in = isset($_POST['khan_him_specs']) && is_array($_POST['khan_him_specs']) ? wp_unslash($_POST['khan_him_specs']) : [];
    $specs = [];
    foreach ($specs_in as $row) {
        if (!is_array($row)) {
            continue;
        }
        $name = sanitize_text_field((string) ($row['name'] ?? ''));
        $value = sanitize_text_field((string) ($row['value'] ?? ''));
        if ($name === '' || $value === '') {
            continue;
        }
        $specs[] = ['name' => $name, 'value' => $value];
    }
    update_post_meta($post_id, 'khan_him_specs', $specs);

    $gallery_raw = isset($_POST['khan_him_gallery']) ? (string) wp_unslash($_POST['khan_him_gallery']) : '';
    $gallery = array_values(array_filter(array_map('intval', explode(',', $gallery_raw))));
    update_post_meta($post_id, 'khan_him_gallery', $gallery);
    if ($gallery !== []) {
        set_post_thumbnail($post_id, $gallery[0]);
    } else {
        delete_post_thumbnail($post_id);
    }

    $docs_in = isset($_POST['khan_him_documents']) && is_array($_POST['khan_him_documents']) ? wp_unslash($_POST['khan_him_documents']) : [];
    $docs = [];
    foreach ($docs_in as $row) {
        if (!is_array($row)) {
            continue;
        }
        $id = (int) ($row['id'] ?? 0);
        $title = sanitize_text_field((string) ($row['title'] ?? ''));
        if ($id <= 0) {
            continue;
        }
        $docs[] = ['id' => $id, 'title' => $title];
    }
    update_post_meta($post_id, 'khan_him_documents', $docs);
}, 10, 3);

/**
 * Make request fields read-only: block updates except trash/delete.
 */
add_filter('wp_insert_post_data', static function (array $data, array $postarr): array {
    if (($data['post_type'] ?? '') !== 'request') {
        return $data;
    }
    $id = (int) ($postarr['ID'] ?? 0);
    if ($id <= 0) {
        return $data;
    }
    // Allow trash/untrash status changes only.
    $original = get_post($id);
    if (!$original instanceof WP_Post) {
        return $data;
    }
    $data['post_title'] = $original->post_title;
    $data['post_content'] = $original->post_content;
    $data['post_excerpt'] = $original->post_excerpt;
    return $data;
}, 20, 2);

add_action('edit_form_after_title', static function (WP_Post $post): void {
    if ($post->post_type === 'request') {
        remove_post_type_support('request', 'title');
        echo '<h1>' . esc_html($post->post_title) . '</h1>';
    }
});
