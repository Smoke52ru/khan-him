<?php
declare(strict_types=1);
get_header();
the_post();
$post_id = get_the_ID();
$gallery = khan_him_product_gallery_ids($post_id);
if ($gallery === []) {
    $thumb = (int) get_post_thumbnail_id($post_id);
    if ($thumb) {
        $gallery = [$thumb];
    }
}
$availability = khan_him_product_meta($post_id, 'availability', 'stock');
$alt = khan_him_product_alt_names($post_id);
$formula = khan_him_product_meta($post_id, 'formula');
$specs = khan_him_product_specs($post_id);
$docs = khan_him_product_documents($post_id);
$related = khan_him_related_products($post_id, 4);
$terms = get_the_terms($post_id, 'product_cat');
$category_names = [];
if (is_array($terms)) {
    foreach ($terms as $term) {
        $category_names[] = $term->name;
    }
}

$fields = [
    ['Артикул', khan_him_product_meta($post_id, 'sku'), true],
    ['Альтернативные названия', $alt !== [] ? implode(', ', $alt) : '', false],
    ['Формула', $formula, true],
    ['Номер CAS', khan_him_product_meta($post_id, 'cas'), true],
    ['ГОСТ', khan_him_product_meta($post_id, 'gost'), false],
    ['ТУ', khan_him_product_meta($post_id, 'tu'), false],
    ['Фасовка', khan_him_product_meta($post_id, 'packaging'), false],
    ['Наличие', $availability === 'order' ? 'Под заказ' : 'На складе', false],
];
$catalog_url = get_post_type_archive_link('product');
?>
<article class="site-shell product-detail">
  <a class="back-link" href="<?php echo esc_url($catalog_url); ?>">← В каталог</a>

  <div class="product-detail__top">
    <div class="product-detail__gallery">
      <?php if ($gallery === []) : ?>
        <div class="product-card__placeholder">Нет фото</div>
      <?php else : ?>
        <?php foreach ($gallery as $image_id) : ?>
          <?php echo wp_get_attachment_image($image_id, 'large', false, ['alt' => get_the_title()]); ?>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>

    <div>
      <h1 class="page-title product-detail__title"><?php the_title(); ?></h1>
      <?php if ($formula !== '') : ?>
        <p class="formula" style="margin:0.75rem 0 0;font-size:1rem"><?php echo esc_html($formula); ?></p>
      <?php endif; ?>
      <div style="margin-top:1rem"><?php khan_him_offer_disclaimer(); ?></div>

      <dl class="field-list">
        <?php foreach ($fields as [$label, $value, $mono]) :
            if ($value === '') {
                continue;
            }
            ?>
          <div class="field-list__row">
            <dt><?php echo esc_html($label); ?></dt>
            <dd class="<?php echo $mono ? 'is-mono' : ''; ?>"><?php echo esc_html($value); ?></dd>
          </div>
        <?php endforeach; ?>
        <?php if ($category_names !== []) : ?>
          <div class="field-list__row">
            <dt>Категории</dt>
            <dd><?php echo esc_html(implode(', ', $category_names)); ?></dd>
          </div>
        <?php endif; ?>
      </dl>

      <p style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:2rem">
        <button
          type="button"
          class="btn btn-primary"
          data-add-to-request
          data-product-id="<?php echo (int) $post_id; ?>"
          data-product-name="<?php echo esc_attr(get_the_title()); ?>"
          data-product-sku="<?php echo esc_attr(khan_him_product_meta($post_id, 'sku')); ?>"
        >В запрос</button>
        <a class="btn btn-secondary" href="<?php echo esc_url(add_query_arg(['product' => $post_id], home_url('/request/'))); ?>">Запросить цену</a>
      </p>
    </div>
  </div>

  <section class="product-detail__sections">
    <?php if (get_the_content()) : ?>
      <h2 class="section-title">Описание</h2>
      <div class="prose"><?php the_content(); ?></div>
    <?php endif; ?>

    <?php
    foreach (
        [
            'application' => 'Применение',
            'storage' => 'Хранение',
            'transport' => 'Транспортировка',
            'safety' => 'Техника безопасности',
        ] as $key => $label
    ) {
        $value = khan_him_product_meta($post_id, $key);
        if ($value === '') {
            continue;
        }
        echo '<h2 class="section-title">' . esc_html($label) . '</h2>';
        echo '<div class="prose">' . wp_kses_post(wpautop($value)) . '</div>';
    }
    ?>

    <?php if ($specs !== []) : ?>
      <h2 class="section-title">Технические характеристики</h2>
      <table class="request-list-table" style="max-width:42rem">
        <tbody>
        <?php foreach ($specs as $row) : ?>
          <tr>
            <th><?php echo esc_html($row['name']); ?></th>
            <td class="formula"><?php echo esc_html($row['value']); ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>

    <?php if ($docs !== []) : ?>
      <h2 class="section-title">Документы</h2>
      <ul class="docs-list">
        <?php foreach ($docs as $doc) :
            $info = khan_him_document_info($doc['id'], $doc['title']);
            if (!$info) {
                continue;
            }
            $meta_bits = array_filter([
                $info['mime'] !== '' ? $info['mime'] : null,
                $info['size'] !== '' ? $info['size'] : null,
            ]);
            ?>
          <li>
            <a href="<?php echo esc_url($info['url']); ?>" download>
              <?php echo esc_html($info['title']); ?>
            </a>
            <?php if ($meta_bits !== []) : ?>
              <span class="formula"><?php echo esc_html(implode(' · ', $meta_bits)); ?></span>
            <?php endif; ?>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </section>

  <?php if ($related !== []) : ?>
    <section class="related-section">
      <h2 class="section-title">Смотрите также</h2>
      <div class="product-grid" style="margin-top:2rem">
        <?php foreach ($related as $related_post) :
            $GLOBALS['post'] = $related_post;
            setup_postdata($related_post);
            get_template_part('template-parts/product', 'card');
        endforeach;
        wp_reset_postdata();
        ?>
      </div>
    </section>
  <?php endif; ?>
</article>
<?php
get_footer();
