<?php
declare(strict_types=1);
get_header();
$args = khan_him_catalog_request_args();
$query = khan_him_query_products($args);
$categories = khan_him_categories_with_products();
$per_page = 24;
$total_pages = max(1, (int) $query->max_num_pages);
$total_docs = (int) $query->found_posts;
$archive_url = get_post_type_archive_link('product');

$build_url = static function (array $overrides) use ($args, $archive_url): string {
    $params = array_filter([
        'q' => $args['q'] !== '' ? $args['q'] : null,
        'category' => $args['category'] !== '' ? $args['category'] : null,
        'availability' => $args['availability'] !== '' ? $args['availability'] : null,
        'paged' => $args['paged'] > 1 ? (string) $args['paged'] : null,
    ], static fn ($v) => $v !== null && $v !== '');
    foreach ($overrides as $key => $value) {
        if ($value === null || $value === '' || ($key === 'paged' && (int) $value <= 1)) {
            unset($params[$key]);
            continue;
        }
        $params[$key] = (string) $value;
    }
    return $params === [] ? $archive_url : add_query_arg($params, $archive_url);
};
?>
<div class="site-shell section">
  <h1 class="page-title">Каталог</h1>
  <div style="max-width:42rem;margin-top:1rem"><?php khan_him_offer_disclaimer(); ?></div>

  <form class="filters" method="get" action="<?php echo esc_url($archive_url); ?>">
    <input
      class="field"
      type="search"
      name="q"
      value="<?php echo esc_attr($args['q']); ?>"
      placeholder="Название, формула, CAS, артикул"
      aria-label="Поиск"
    >
    <select class="field" name="category" aria-label="Категория">
      <option value="">Все категории</option>
      <?php foreach ($categories as $term) : ?>
        <option value="<?php echo esc_attr($term->slug); ?>" <?php selected($args['category'], $term->slug); ?>>
          <?php echo esc_html($term->name); ?>
        </option>
      <?php endforeach; ?>
    </select>
    <select class="field" name="availability" aria-label="Наличие">
      <option value="">Любое наличие</option>
      <option value="stock" <?php selected($args['availability'], 'stock'); ?>>На складе</option>
      <option value="order" <?php selected($args['availability'], 'order'); ?>>Под заказ</option>
    </select>
    <button class="btn btn-primary" type="submit">Применить</button>
  </form>

  <?php if (!$query->have_posts()) : ?>
    <div class="empty-panel">
      <p><strong>Ничего не найдено.</strong></p>
      <p>Попробуйте другой запрос или оставьте быструю заявку — подберём позицию вручную.</p>
      <a class="btn btn-secondary" href="<?php echo esc_url(home_url('/request/')); ?>">Оставить быструю заявку</a>
      <?php if ($args['paged'] > 1) : ?>
        <p style="margin-top:1rem"><a href="<?php echo esc_url($archive_url); ?>">Вернуться к началу каталога</a></p>
      <?php endif; ?>
    </div>
  <?php else : ?>
    <div class="product-grid" style="margin-top:2.5rem">
      <?php while ($query->have_posts()) : $query->the_post(); ?>
        <?php get_template_part('template-parts/product', 'card'); ?>
      <?php endwhile; ?>
    </div>
    <?php if ($total_pages > 1) : ?>
      <nav class="pagination" aria-label="Страницы каталога">
        <?php if ($args['paged'] > 1) : ?>
          <a href="<?php echo esc_url($build_url(['paged' => (string) ($args['paged'] - 1)])); ?>">Назад</a>
        <?php endif; ?>
        <span class="pagination__status">
          Страница <?php echo (int) $args['paged']; ?> из <?php echo (int) $total_pages; ?>
          (<?php echo (int) $total_docs; ?> позиций, по <?php echo (int) $per_page; ?>)
        </span>
        <?php if ($args['paged'] < $total_pages) : ?>
          <a href="<?php echo esc_url($build_url(['paged' => (string) ($args['paged'] + 1)])); ?>">Вперёд</a>
        <?php endif; ?>
      </nav>
    <?php endif; ?>
    <?php wp_reset_postdata(); ?>
  <?php endif; ?>
</div>
<?php
get_footer();
