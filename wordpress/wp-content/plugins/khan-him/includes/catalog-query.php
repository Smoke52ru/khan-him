<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @return array{q:string,category:string,availability:string,paged:int}
 */
function khan_him_catalog_request_args(): array
{
    return [
        'q' => isset($_GET['q']) ? sanitize_text_field((string) wp_unslash($_GET['q'])) : '',
        'category' => isset($_GET['category']) ? sanitize_title((string) wp_unslash($_GET['category'])) : '',
        'availability' => isset($_GET['availability']) ? sanitize_text_field((string) wp_unslash($_GET['availability'])) : '',
        'paged' => max(1, (int) (get_query_var('paged') ?: ($_GET['paged'] ?? 1))),
    ];
}

/**
 * @param array{q?:string,category?:string,availability?:string,paged?:int} $args
 */
function khan_him_query_products(array $args = []): WP_Query
{
    $q = trim((string) ($args['q'] ?? ''));
    $category = (string) ($args['category'] ?? '');
    $availability = (string) ($args['availability'] ?? '');
    $paged = max(1, (int) ($args['paged'] ?? 1));

    $query_args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 24,
        'paged' => $paged,
        'orderby' => 'title',
        'order' => 'ASC',
    ];

    if ($category !== '') {
        $query_args['tax_query'] = [[
            'taxonomy' => 'product_cat',
            'field' => 'slug',
            'terms' => [$category],
        ]];
    }

    if (in_array($availability, ['stock', 'order'], true)) {
        $query_args['meta_query'][] = [
            'key' => 'khan_him_availability',
            'value' => $availability,
        ];
    }

    if ($q !== '') {
        $query_args['khan_him_search'] = $q;
        add_filter('posts_clauses', 'khan_him_catalog_search_clauses', 10, 2);
    }

    $query = new WP_Query($query_args);

    if ($q !== '') {
        remove_filter('posts_clauses', 'khan_him_catalog_search_clauses', 10);
    }

    return $query;
}

/**
 * @param array<string, string> $clauses
 * @return array<string, string>
 */
function khan_him_catalog_search_clauses(array $clauses, WP_Query $query): array
{
    global $wpdb;
    $term = $query->get('khan_him_search');
    if (!is_string($term) || $term === '') {
        return $clauses;
    }

    $like = '%' . $wpdb->esc_like($term) . '%';
    $meta_keys = ['khan_him_sku', 'khan_him_formula', 'khan_him_cas', 'khan_him_alt_names'];
    $meta_sql = [];
    foreach ($meta_keys as $key) {
        $meta_sql[] = $wpdb->prepare(
            "EXISTS (
                SELECT 1 FROM {$wpdb->postmeta} pm
                WHERE pm.post_id = {$wpdb->posts}.ID
                  AND pm.meta_key = %s
                  AND pm.meta_value LIKE %s
            )",
            $key,
            $like
        );
    }

    $title_sql = $wpdb->prepare("{$wpdb->posts}.post_title LIKE %s", $like);
    $clauses['where'] .= ' AND (' . $title_sql . ' OR ' . implode(' OR ', $meta_sql) . ')';
    return $clauses;
}

function khan_him_adjust_product_query(WP_Query $query): void
{
    if (is_admin() || !$query->is_main_query()) {
        return;
    }
    if ($query->is_post_type_archive('product')) {
        $args = khan_him_catalog_request_args();
        $query->set('posts_per_page', 24);
        $query->set('orderby', 'title');
        $query->set('order', 'ASC');
        $query->set('post_status', 'publish');
        if ($args['category'] !== '') {
            $query->set('tax_query', [[
                'taxonomy' => 'product_cat',
                'field' => 'slug',
                'terms' => [$args['category']],
            ]]);
        }
        if (in_array($args['availability'], ['stock', 'order'], true)) {
            $query->set('meta_query', [[
                'key' => 'khan_him_availability',
                'value' => $args['availability'],
            ]]);
        }
        if ($args['q'] !== '') {
            $query->set('khan_him_search', $args['q']);
            add_filter('posts_clauses', 'khan_him_catalog_search_clauses', 10, 2);
            add_action('wp', static function () {
                remove_filter('posts_clauses', 'khan_him_catalog_search_clauses', 10);
            });
        }
    }
}

/**
 * @return list<WP_Post>
 */
function khan_him_related_products(int $product_id, int $limit = 4): array
{
    $terms = wp_get_post_terms($product_id, 'product_cat', ['fields' => 'ids']);
    if (is_wp_error($terms) || $terms === []) {
        return [];
    }
    $q = new WP_Query([
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'post__not_in' => [$product_id],
        'orderby' => 'title',
        'order' => 'ASC',
        'tax_query' => [[
            'taxonomy' => 'product_cat',
            'field' => 'term_id',
            'terms' => $terms,
        ]],
    ]);
    return $q->posts;
}

/**
 * Resolve published product IDs still available for a request list.
 *
 * @param list<int> $ids
 * @return array{available:list<WP_Post>,missing:list<int>}
 */
function khan_him_resolve_request_products(array $ids): array
{
    $available = [];
    $missing = [];
    foreach ($ids as $id) {
        $id = (int) $id;
        $post = get_post($id);
        if (!$post instanceof WP_Post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
            $missing[] = $id;
            continue;
        }
        $available[] = $post;
    }
    return ['available' => $available, 'missing' => $missing];
}
