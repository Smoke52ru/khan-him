<?php
declare(strict_types=1);
$post_id = get_the_ID();
$gallery = khan_him_product_gallery_ids($post_id);
$image_id = $gallery[0] ?? (int) get_post_thumbnail_id($post_id);
$availability = khan_him_product_meta($post_id, 'availability', 'stock');
$formula = khan_him_product_meta($post_id, 'formula');
$alt_names = khan_him_product_alt_names($post_id);
$packaging = khan_him_product_meta($post_id, 'packaging');
$on_stock = $availability !== 'order';
?>
<article class="product-card">
  <a class="product-card__media" href="<?php the_permalink(); ?>">
    <?php if ($image_id) : ?>
      <?php echo wp_get_attachment_image($image_id, 'medium_large', false, ['alt' => get_the_title()]); ?>
    <?php else : ?>
      <div class="product-card__placeholder">Нет фото</div>
    <?php endif; ?>
  </a>
  <div class="product-card__body">
    <h3 class="product-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
    <?php if ($formula !== '') : ?>
      <p class="formula"><?php echo esc_html($formula); ?></p>
    <?php endif; ?>
    <?php if ($alt_names !== []) : ?>
      <p class="product-card__meta"><?php echo esc_html(implode(', ', $alt_names)); ?></p>
    <?php endif; ?>
    <?php if ($packaging !== '') : ?>
      <p class="product-card__meta">Фасовка: <?php echo esc_html($packaging); ?></p>
    <?php endif; ?>
    <p class="product-card__availability <?php echo $on_stock ? 'is-stock' : 'is-order'; ?>">
      <?php echo $on_stock ? 'На складе' : 'Под заказ'; ?>
    </p>
    <div class="product-card__cta">
      <button
        type="button"
        class="btn btn-primary"
        data-add-to-request
        data-product-id="<?php echo (int) $post_id; ?>"
        data-product-name="<?php echo esc_attr(get_the_title()); ?>"
        data-product-sku="<?php echo esc_attr(khan_him_product_meta($post_id, 'sku')); ?>"
      >В запрос</button>
    </div>
  </div>
</article>
