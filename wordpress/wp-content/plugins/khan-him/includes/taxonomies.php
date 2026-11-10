<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

function khan_him_register_taxonomies(): void
{
    register_taxonomy('product_cat', ['product'], [
        'labels' => [
            'name' => 'Категории',
            'singular_name' => 'Категория',
            'search_items' => 'Искать категории',
            'all_items' => 'Все категории',
            'edit_item' => 'Изменить категорию',
            'update_item' => 'Обновить категорию',
            'add_new_item' => 'Добавить категорию',
            'new_item_name' => 'Название категории',
            'menu_name' => 'Категории',
        ],
        'public' => true,
        'hierarchical' => true,
        'show_admin_column' => true,
        'rewrite' => [
            'slug' => 'category',
            'with_front' => false,
        ],
        'show_in_rest' => false,
    ]);
}

add_action('product_cat_add_form_fields', static function (): void {
    ?>
    <div class="form-field">
        <label for="khan_him_term_order">Порядок</label>
        <input type="number" name="khan_him_term_order" id="khan_him_term_order" value="0" step="1">
        <p>Меньше число — выше в фильтре на сайте.</p>
    </div>
    <?php
});

add_action('product_cat_edit_form_fields', static function (WP_Term $term): void {
    $order = (int) get_term_meta($term->term_id, 'khan_him_order', true);
    ?>
    <tr class="form-field">
        <th scope="row"><label for="khan_him_term_order">Порядок</label></th>
        <td>
            <input type="number" name="khan_him_term_order" id="khan_him_term_order" value="<?php echo esc_attr((string) $order); ?>" step="1">
            <p class="description">Меньше число — выше в фильтре на сайте.</p>
        </td>
    </tr>
    <?php
});

$save_order = static function (int $term_id): void {
    if (!isset($_POST['khan_him_term_order'])) {
        return;
    }
    $order = (int) wp_unslash($_POST['khan_him_term_order']);
    update_term_meta($term_id, 'khan_him_order', $order);
};

add_action('created_product_cat', $save_order);
add_action('edited_product_cat', $save_order);

/**
 * Categories with at least one published product, ordered by meta.
 *
 * @return list<WP_Term>
 */
function khan_him_categories_with_products(): array
{
    $terms = get_terms([
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
    ]);
    if (is_wp_error($terms) || !is_array($terms)) {
        return [];
    }

    $with_products = [];
    foreach ($terms as $term) {
        $q = new WP_Query([
            'post_type' => 'product',
            'post_status' => 'publish',
            'posts_per_page' => 1,
            'fields' => 'ids',
            'tax_query' => [[
                'taxonomy' => 'product_cat',
                'field' => 'term_id',
                'terms' => [$term->term_id],
            ]],
            'no_found_rows' => true,
        ]);
        if ($q->have_posts()) {
            $with_products[] = $term;
        }
    }

    usort($with_products, static function (WP_Term $a, WP_Term $b): int {
        $oa = (int) get_term_meta($a->term_id, 'khan_him_order', true);
        $ob = (int) get_term_meta($b->term_id, 'khan_him_order', true);
        if ($oa === $ob) {
            return strnatcasecmp($a->name, $b->name);
        }
        return $oa <=> $ob;
    });

    return $with_products;
}
