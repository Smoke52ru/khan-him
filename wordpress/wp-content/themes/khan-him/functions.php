<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
});

add_filter('pre_get_document_title', static function (string $title): string {
    if (is_singular('product')) {
        return get_the_title() . ' оптом — Хан-Хим';
    }
    return $title;
});

add_action('wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'khan-him-fonts',
        'https://fonts.googleapis.com/css2?family=Geologica:wght@500;600&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'khan-him-main',
        get_template_directory_uri() . '/assets/site.css',
        ['khan-him-fonts'],
        '0.2.0'
    );
    wp_enqueue_script(
        'khan-him-request-list',
        get_template_directory_uri() . '/assets/request-list.js',
        [],
        '0.2.0',
        true
    );
    wp_localize_script('khan-him-request-list', 'khanHim', [
        'storageKey' => 'khan-him-request-list',
        'resolveUrl' => rest_url('khan-him/v1/products'),
    ]);
});

add_action('rest_api_init', static function (): void {
    register_rest_route('khan-him/v1', '/products', [
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => static function (WP_REST_Request $request) {
            $ids = array_filter(array_map('intval', explode(',', (string) $request->get_param('ids'))));
            $out = [];
            foreach ($ids as $id) {
                $post = get_post($id);
                if (!$post instanceof WP_Post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
                    $out[] = ['id' => $id, 'available' => false];
                    continue;
                }
                $out[] = [
                    'id' => $id,
                    'available' => true,
                    'name' => get_the_title($post),
                    'sku' => khan_him_product_meta($id, 'sku'),
                    'slug' => $post->post_name,
                    'url' => get_permalink($post),
                ];
            }
            return $out;
        },
    ]);
});

/**
 * Document helper for templates.
 *
 * @return array{title:string,url:string,mime:string,size:string}|null
 */
function khan_him_document_info(int $attachment_id, string $title = ''): ?array
{
    $url = wp_get_attachment_url($attachment_id);
    if (!$url) {
        return null;
    }
    $path = get_attached_file($attachment_id);
    $size = ($path && file_exists($path)) ? size_format((int) filesize($path)) : '';
    $mime = (string) get_post_mime_type($attachment_id);
    $ext = $mime !== '' ? strtoupper((string) pathinfo((string) $path, PATHINFO_EXTENSION)) : '';
    return [
        'title' => $title !== '' ? $title : (string) get_the_title($attachment_id),
        'url' => $url,
        'mime' => $ext !== '' ? $ext : $mime,
        'size' => $size,
    ];
}

function khan_him_offer_disclaimer(): void
{
    echo '<p class="offer-disclaimer">Информация на сайте не является публичной офертой. Актуальные цены и наличие уточняйте у менеджера.</p>';
}
