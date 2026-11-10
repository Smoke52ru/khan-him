<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_register_post_types(): void
{
    register_post_type('product', [
        'labels' => [
            'name' => 'Товары',
            'singular_name' => 'Товар',
            'add_new' => 'Добавить товар',
            'add_new_item' => 'Добавить товар',
            'edit_item' => 'Изменить товар',
            'new_item' => 'Новый товар',
            'view_item' => 'Смотреть товар',
            'search_items' => 'Искать товары',
            'not_found' => 'Товары не найдены',
            'not_found_in_trash' => 'В корзине товаров нет',
            'all_items' => 'Все товары',
            'menu_name' => 'Товары',
        ],
        'public' => true,
        'has_archive' => true,
        // Avoid capturing ?product= on /request/ (prototype-compatible query arg).
        'query_var' => false,
        'rewrite' => [
            'slug' => 'catalog',
            'with_front' => false,
        ],
        'menu_icon' => 'dashicons-products',
        'menu_position' => 5,
        'supports' => ['title', 'editor', 'thumbnail'],
        'show_in_rest' => false,
        'capability_type' => 'post',
        'map_meta_cap' => true,
    ]);

    register_post_type('request', [
        'labels' => [
            'name' => 'Заявки',
            'singular_name' => 'Заявка',
            'edit_item' => 'Заявка',
            'search_items' => 'Искать заявки',
            'not_found' => 'Заявок нет',
            'all_items' => 'Все заявки',
            'menu_name' => 'Заявки',
        ],
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => false,
        'capability_type' => 'post',
        'map_meta_cap' => true,
        'capabilities' => [
            'create_posts' => 'do_not_allow',
        ],
        'supports' => ['title'],
        'menu_icon' => 'dashicons-email-alt',
        'menu_position' => 6,
    ]);
}

add_filter('register_post_type_args', static function (array $args, string $post_type): array {
    if ($post_type !== 'request') {
        return $args;
    }
    // Keep create blocked even after activation.
    $args['capabilities']['create_posts'] = 'do_not_allow';
    return $args;
}, 10, 2);

add_action('admin_head', static function (): void {
    global $post_type;
    if ($post_type !== 'request') {
        return;
    }
    echo '<style>.page-title-action{display:none!important}</style>';
});

/**
 * Auto-slug products from title (GOST translit + uniqueness).
 */
add_filter('wp_insert_post_data', static function (array $data, array $postarr): array {
    if (($data['post_type'] ?? '') !== 'product') {
        return $data;
    }

    $title = trim((string) ($data['post_title'] ?? ''));
    if ($title === '') {
        return $data;
    }

    $base = khan_him_slugify($title);
    if ($base === '') {
        $base = 'product';
    }

    $exclude_id = (int) ($postarr['ID'] ?? 0);
    $existing = get_posts([
        'post_type' => 'product',
        'post_status' => ['publish', 'draft', 'pending', 'private', 'future'],
        'posts_per_page' => 100,
        'fields' => 'ids',
        'suppress_filters' => true,
    ]);
    $slugs = [];
    foreach ($existing as $id) {
        if ((int) $id === $exclude_id) {
            continue;
        }
        $slugs[] = get_post_field('post_name', $id);
    }

    // Keep manually set unique slug on update only when it already matches pattern.
    $incoming = sanitize_title((string) ($data['post_name'] ?? ''));
    if ($incoming !== '' && $exclude_id > 0 && !in_array($incoming, $slugs, true)) {
        // Prefer regenerated base when title drives slug on first save.
        if ($incoming === sanitize_title($title) || str_starts_with($incoming, $base)) {
            $data['post_name'] = khan_him_unique_slug($base, $slugs);
            return $data;
        }
    }

    $data['post_name'] = khan_him_unique_slug($base, $slugs);
    return $data;
}, 10, 2);

/**
 * Require product title.
 */
add_filter('wp_insert_post_empty_content', static function (bool $maybe_empty, array $postarr): bool {
    if (($postarr['post_type'] ?? '') !== 'product') {
        return $maybe_empty;
    }
    $title = trim((string) ($postarr['post_title'] ?? ''));
    if ($title === '') {
        return true;
    }
    return false;
}, 10, 2);

/**
 * Russian label for publish status on products.
 */
add_filter('display_post_states', static function (array $states, WP_Post $post): array {
    if ($post->post_type !== 'product') {
        return $states;
    }
    if ($post->post_status === 'draft') {
        $states['draft'] = 'Снят с публикации';
    }
    if ($post->post_status === 'publish') {
        unset($states['publish']);
    }
    return $states;
}, 10, 2);
