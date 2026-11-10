<?php
/**
 * Plugin Name: Хан-Хим
 * Description: Каталог, заявки и настройки сайта Хан-Хим.
 * Version: 0.1.0
 * Author: Хан-Хим
 * Text Domain: khan-him
 * Requires at least: 6.4
 * Requires PHP: 8.2
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

define('KHAN_HIM_VERSION', '0.1.0');
define('KHAN_HIM_PLUGIN_FILE', __FILE__);
define('KHAN_HIM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('KHAN_HIM_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once KHAN_HIM_PLUGIN_DIR . 'includes/slugify.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/post-types.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/taxonomies.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/meta.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/upload-limits.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/users.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/mail.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/settings.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/admin-products.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/catalog-query.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/antispam.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/requests.php';
require_once KHAN_HIM_PLUGIN_DIR . 'includes/sitemap.php';

register_activation_hook(__FILE__, static function (): void {
    khan_him_register_post_types();
    khan_him_register_taxonomies();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, static function (): void {
    flush_rewrite_rules();
});

add_action('plugins_loaded', static function (): void {
    load_plugin_textdomain('khan-him', false, dirname(plugin_basename(__FILE__)) . '/languages');
});

add_action('init', 'khan_him_register_post_types');
add_action('init', 'khan_him_register_taxonomies');
add_action('init', 'khan_him_register_meta');
add_action('admin_init', 'khan_him_admin_init');
add_action('admin_menu', 'khan_him_admin_menu');
add_action('admin_enqueue_scripts', 'khan_him_admin_assets');
add_action('wp_enqueue_scripts', 'khan_him_public_assets');
add_action('phpmailer_init', 'khan_him_configure_phpmailer');
add_action('admin_init', 'khan_him_disable_registration');
add_filter('pre_option_users_can_register', static fn () => '0');
add_filter('show_password_fields', '__return_true');
add_action('template_redirect', 'khan_him_handle_request_submit');
add_action('pre_get_posts', 'khan_him_adjust_product_query');
add_filter('wp_sitemaps_posts_query_args', 'khan_him_sitemap_posts_args', 10, 2);
add_filter('wp_sitemaps_add_provider', 'khan_him_filter_sitemap_providers', 10, 2);

/**
 * Hide Posts and Comments menus — this site does not use them.
 */
add_action('admin_menu', static function (): void {
    remove_menu_page('edit.php');
    remove_menu_page('edit-comments.php');
}, 99);

add_action('wp_before_admin_bar_render', static function (): void {
    global $wp_admin_bar;
    if (!$wp_admin_bar instanceof WP_Admin_Bar) {
        return;
    }
    $wp_admin_bar->remove_node('comments');
    $wp_admin_bar->remove_node('new-post');
});

function khan_him_admin_assets(string $hook): void
{
    if (!in_array($hook, ['post.php', 'post-new.php', 'toplevel_page_khan-him-settings'], true)) {
        return;
    }
    wp_enqueue_media();
    wp_enqueue_script(
        'khan-him-admin',
        KHAN_HIM_PLUGIN_URL . 'assets/admin.js',
        ['jquery'],
        KHAN_HIM_VERSION,
        true
    );
    wp_enqueue_style(
        'khan-him-admin',
        KHAN_HIM_PLUGIN_URL . 'assets/admin.css',
        [],
        KHAN_HIM_VERSION
    );
}

function khan_him_public_assets(): void
{
    // Theme owns public CSS/JS; plugin only exposes REST/AJAX endpoints.
}
