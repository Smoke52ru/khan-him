<?php
/**
 * WP-CLI: wp eval-file /scripts/seed.php
 * Flags via env: KHAN_HIM_SEED_RESET=1
 *
 * Note: no declare(strict_types=1) — wp eval-file wraps the file.
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Run via WP-CLI inside the WordPress container.\n");
    exit(1);
}

$reset = getenv('KHAN_HIM_SEED_RESET') === '1'
    || (isset($args) && is_array($args) && in_array('--reset', $args, true));

$admin_user = getenv('ADMIN_USER') ?: 'admin';
$admin_email = getenv('ADMIN_EMAIL') ?: 'admin@example.com';
$admin_password = getenv('ADMIN_PASSWORD') ?: 'admin-change-me';
$fallback_email = getenv('REQUESTS_FALLBACK_EMAIL') ?: 'demo@example.com';

/**
 * Каталог seed/: Docker (/seed), рядом со скриптом, или KHAN_HIM_SEED_DIR.
 */
function khan_him_seed_root(): string
{
    $from_env = getenv('KHAN_HIM_SEED_DIR');
    if (is_string($from_env) && $from_env !== '' && is_dir($from_env)) {
        return rtrim($from_env, '/');
    }
    if (is_dir('/seed')) {
        return '/seed';
    }
    $adjacent = __DIR__ . '/seed';
    if (is_dir($adjacent)) {
        return $adjacent;
    }
    $repo = dirname(__DIR__) . '/seed';
    if (is_dir($repo)) {
        return $repo;
    }
    WP_CLI::error('Каталог seed не найден. Задайте KHAN_HIM_SEED_DIR или положите seed/ рядом со скриптом.');
}

$categories = [
    ['name' => 'Кислоты', 'order' => 1],
    ['name' => 'Щёлочи и соли', 'order' => 2],
    ['name' => 'Растворители', 'order' => 3],
    ['name' => 'ПАВ', 'order' => 4],
    ['name' => 'Гликоли и спирты', 'order' => 5],
    ['name' => 'Сорбенты и катализаторы', 'order' => 6],
];

$seed_root = khan_him_seed_root();
$products = require $seed_root . '/products.php';

if ($reset) {
    $old_products = get_posts([
        'post_type' => 'product',
        'post_status' => 'any',
        'posts_per_page' => -1,
        'fields' => 'ids',
    ]);
    foreach ($old_products as $id) {
        wp_delete_post((int) $id, true);
    }
    $terms = get_terms(['taxonomy' => 'product_cat', 'hide_empty' => false]);
    if (!is_wp_error($terms)) {
        foreach ($terms as $term) {
            wp_delete_term((int) $term->term_id, 'product_cat');
        }
    }
    WP_CLI::log('Catalog cleared.');
}

if (!username_exists($admin_user) && !email_exists($admin_email)) {
    $user_id = wp_create_user($admin_user, $admin_password, $admin_email);
    if (!is_wp_error($user_id)) {
        $user = new WP_User($user_id);
        $user->set_role('administrator');
        WP_CLI::log("Admin created: {$admin_email}");
    }
} else {
    $user = get_user_by('login', $admin_user) ?: get_user_by('email', $admin_email);
    if ($user instanceof WP_User) {
        $user->set_role('administrator');
        wp_update_user(['ID' => $user->ID, 'user_pass' => $admin_password, 'user_email' => $admin_email]);
        WP_CLI::log("Admin updated: {$admin_email}");
    }
}

update_option('khan_him_site_settings', [
    'company_name' => 'Хан-Хим',
    'phone' => '+7 (495) 000-00-00',
    'email' => 'info@example.com',
    'address' => 'Москва',
    'inn' => '7700000000',
    'ogrn' => '1027700000000',
    'kpp' => '770001001',
    'legal_address' => 'Москва',
    'request_emails' => [$fallback_email],
]);

update_option('blogname', 'Хан-Хим');
update_option('blogdescription', 'Оптовый каталог химической продукции');
update_option('WPLANG', 'ru_RU');
update_option('users_can_register', 0);
update_option('permalink_structure', '/%postname%/');
flush_rewrite_rules();

$pages = [
    'about' => 'О компании',
    'contacts' => 'Контакты',
    'requisites' => 'Реквизиты',
    'privacy' => 'Политика конфиденциальности',
    'pd-consent' => 'Согласие на обработку персональных данных',
    'request' => 'Быстрая заявка',
    'request-list' => 'Список запроса',
];
foreach ($pages as $slug => $title) {
    $existing = get_page_by_path($slug);
    if ($existing) {
        continue;
    }
    wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => $title,
        'post_name' => $slug,
        'post_content' => '',
    ]);
}

$front = get_page_by_path('about'); // placeholder; front is posts? use show_on_front page
// Use a dedicated home: create if missing
$home = get_page_by_path('home');
if (!$home) {
    $home_id = wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_title' => 'Главная',
        'post_name' => 'home',
        'post_content' => '',
    ]);
} else {
    $home_id = $home->ID;
}
update_option('show_on_front', 'page');
update_option('page_on_front', (int) $home_id);

$term_ids = [];
foreach ($categories as $cat) {
    $existing = term_exists($cat['name'], 'product_cat');
    if ($existing) {
        $term_id = (int) (is_array($existing) ? $existing['term_id'] : $existing);
    } else {
        $created = wp_insert_term($cat['name'], 'product_cat', [
            'slug' => khan_him_slugify($cat['name']),
        ]);
        if (is_wp_error($created)) {
            WP_CLI::warning($created->get_error_message());
            continue;
        }
        $term_id = (int) $created['term_id'];
    }
    update_term_meta($term_id, 'khan_him_order', $cat['order']);
    $term_ids[] = $term_id;
}

function khan_him_seed_sideload(string $path, string $title): int
{
    if (!file_exists($path)) {
        return 0;
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $tmp = wp_tempnam(basename($path));
    copy($path, $tmp);
    $file_array = [
        'name' => basename($path),
        'tmp_name' => $tmp,
    ];
    $id = media_handle_sideload($file_array, 0, $title);
    if (is_wp_error($id)) {
        @unlink($tmp);
        WP_CLI::warning($id->get_error_message());
        return 0;
    }
    return (int) $id;
}

$doc_path = $seed_root . '/assets/pasport-obrazec.pdf';
$doc_id = 0;

$created = 0;
$skipped = 0;
foreach ($products as $product) {
    $existing = get_posts([
        'post_type' => 'product',
        'title' => $product['name'],
        'post_status' => 'any',
        'posts_per_page' => 1,
        'fields' => 'ids',
    ]);
    // WP_Query title exact is unreliable; use meta sku
    $by_sku = get_posts([
        'post_type' => 'product',
        'post_status' => 'any',
        'posts_per_page' => 1,
        'fields' => 'ids',
        'meta_key' => 'khan_him_sku',
        'meta_value' => $product['sku'],
    ]);
    if ($by_sku !== []) {
        $skipped++;
        continue;
    }

    $post_id = wp_insert_post([
        'post_type' => 'product',
        'post_status' => 'publish',
        'post_title' => $product['name'],
        'post_content' => $product['description'],
        'post_name' => khan_him_slugify($product['name']),
    ], true);
    if (is_wp_error($post_id)) {
        WP_CLI::warning($post_id->get_error_message());
        continue;
    }
    $post_id = (int) $post_id;

    $cat_index = (int) $product['categoryIndex'];
    if (isset($term_ids[$cat_index])) {
        wp_set_object_terms($post_id, [$term_ids[$cat_index]], 'product_cat');
    }

    update_post_meta($post_id, 'khan_him_sku', $product['sku']);
    update_post_meta($post_id, 'khan_him_alt_names', $product['altNames']);
    update_post_meta($post_id, 'khan_him_formula', $product['formula'] ?? '');
    update_post_meta($post_id, 'khan_him_cas', $product['cas'] ?? '');
    update_post_meta($post_id, 'khan_him_gost', $product['gost'] ?? '');
    update_post_meta($post_id, 'khan_him_tu', $product['tu'] ?? '');
    update_post_meta($post_id, 'khan_him_packaging', $product['packaging']);
    update_post_meta($post_id, 'khan_him_availability', $product['availability']);
    update_post_meta($post_id, 'khan_him_application', $product['application']);
    update_post_meta($post_id, 'khan_him_storage', $product['storage']);
    update_post_meta($post_id, 'khan_him_transport', $product['transport']);
    update_post_meta($post_id, 'khan_him_safety', $product['safety']);
    update_post_meta($post_id, 'khan_him_specs', $product['specs']);

    $with_image = $product['withImage'] ?? true;
    if ($with_image) {
        $img = $seed_root . '/assets/' . $product['sku'] . '.png';
        $img_id = khan_him_seed_sideload($img, $product['name']);
        if ($img_id > 0) {
            update_post_meta($post_id, 'khan_him_gallery', [$img_id]);
            set_post_thumbnail($post_id, $img_id);
        }
    }

    if (!empty($product['withDocument'])) {
        if ($doc_id <= 0) {
            $doc_id = khan_him_seed_sideload($doc_path, 'Паспорт качества (образец)');
        }
        if ($doc_id > 0) {
            update_post_meta($post_id, 'khan_him_documents', [
                ['id' => $doc_id, 'title' => 'Паспорт качества'],
            ]);
        }
    }

    $created++;
}

switch_theme('khan-him');
activate_plugin('khan-him/khan-him.php');

WP_CLI::success("Seed done. Created {$created}, skipped {$skipped}.");
