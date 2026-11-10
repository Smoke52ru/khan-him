<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @param array<string, mixed> $args
 * @return array<string, mixed>
 */
function khan_him_sitemap_posts_args(array $args, string $post_type): array
{
    if ($post_type === 'product') {
        $args['post_status'] = 'publish';
    }
    return $args;
}

/**
 * @param WP_Sitemaps_Provider|false $provider
 * @return WP_Sitemaps_Provider|false
 */
function khan_him_filter_sitemap_providers($provider, string $name)
{
    if ($name === 'users') {
        return false;
    }
    return $provider;
}
