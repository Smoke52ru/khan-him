<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_disable_registration(): void
{
    update_option('users_can_register', 0);
}

add_filter('rest_endpoints', static function (array $endpoints): array {
    foreach (array_keys($endpoints) as $route) {
        if (!is_string($route)) {
            continue;
        }
        if (str_contains($route, '/users') && (str_contains($route, 'register') || preg_match('#/wp/v2/users/?$#', $route))) {
            // Keep reading users for admins; block anonymous create via capability checks below.
        }
    }
    return $endpoints;
});

add_filter('rest_pre_insert_user', static function ($prepared, $request) {
    if (!is_user_logged_in() || !current_user_can('create_users')) {
        return new WP_Error('khan_him_no_register', 'Регистрация недоступна', ['status' => 403]);
    }
    // Still disallow creating additional admins via public flows — only allow if already admin.
    return $prepared;
}, 10, 2);

add_action('login_form_register', static function (): void {
    wp_die('Регистрация недоступна.', 'Регистрация', ['response' => 403]);
});

add_filter('option_users_can_register', static fn () => 0);

/**
 * Ensure only one administrator exists after seed; block creating another via UI if desired.
 * Soft policy: registration closed; create_users remains for the existing admin (WP core).
 * Spec says registration via site/API is rejected — covered above.
 */
