<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

add_filter('manage_product_posts_columns', static function (array $columns): array {
    $new = [];
    foreach ($columns as $key => $label) {
        $new[$key] = $label;
        if ($key === 'title') {
            $new['sku'] = 'Артикул';
            $new['availability'] = 'Наличие';
        }
    }
    return $new;
});

add_action('manage_product_posts_custom_column', static function (string $column, int $post_id): void {
    if ($column === 'sku') {
        echo esc_html(khan_him_product_meta($post_id, 'sku'));
        return;
    }
    if ($column === 'availability') {
        $v = khan_him_product_meta($post_id, 'availability', 'stock');
        echo esc_html($v === 'order' ? 'Под заказ' : 'На складе');
    }
}, 10, 2);

add_action('restrict_manage_posts', static function (string $post_type): void {
    if ($post_type !== 'product') {
        return;
    }
    $selected_status = isset($_GET['khan_status']) ? sanitize_text_field((string) $_GET['khan_status']) : '';
    echo '<select name="khan_status">';
    echo '<option value="">Все статусы</option>';
    echo '<option value="publish"' . selected($selected_status, 'publish', false) . '>Опубликован</option>';
    echo '<option value="draft"' . selected($selected_status, 'draft', false) . '>Снят с публикации</option>';
    echo '</select>';

    wp_dropdown_categories([
        'show_option_all' => 'Все категории',
        'taxonomy' => 'product_cat',
        'name' => 'product_cat',
        'orderby' => 'name',
        'selected' => isset($_GET['product_cat']) ? (int) $_GET['product_cat'] : 0,
        'hierarchical' => true,
        'show_count' => false,
        'hide_empty' => false,
        'value_field' => 'term_id',
    ]);
});

/**
 * @param mixed $post_type
 */
function khan_him_is_product_query_type($post_type): bool
{
    if ($post_type === 'product') {
        return true;
    }
    return is_array($post_type) && in_array('product', $post_type, true);
}

add_action('pre_get_posts', static function (WP_Query $query): void {
    if (!is_admin() || !$query->is_main_query()) {
        return;
    }
    if (!khan_him_is_product_query_type($query->get('post_type'))) {
        return;
    }

    $status = isset($_GET['khan_status']) ? sanitize_text_field((string) $_GET['khan_status']) : '';
    if (in_array($status, ['publish', 'draft'], true)) {
        $query->set('post_status', $status);
    }

    $s = $query->get('s');
    if (!is_string($s) || trim($s) === '') {
        return;
    }

    add_filter('posts_search', 'khan_him_admin_product_search', 10, 2);
});

function khan_him_admin_product_search(string $search, WP_Query $query): string
{
    global $wpdb;
    if (!is_admin() || !khan_him_is_product_query_type($query->get('post_type'))) {
        return $search;
    }
    $term = $query->get('s');
    if (!is_string($term) || trim($term) === '') {
        return $search;
    }
    remove_filter('posts_search', 'khan_him_admin_product_search', 10);
    $like = '%' . $wpdb->esc_like($term) . '%';
    $search = $wpdb->prepare(
        " AND (({$wpdb->posts}.post_title LIKE %s) OR EXISTS (
            SELECT 1 FROM {$wpdb->postmeta} pm
            WHERE pm.post_id = {$wpdb->posts}.ID
              AND pm.meta_key = 'khan_him_sku'
              AND pm.meta_value LIKE %s
        ))",
        $like,
        $like
    );
    return $search;
}

add_filter('post_row_actions', static function (array $actions, WP_Post $post): array {
    if ($post->post_type === 'request') {
        unset($actions['inline hide-if-no-js'], $actions['edit']);
        // Keep view/edit link via title; remove quick edit.
    }
    return $actions;
}, 10, 2);
