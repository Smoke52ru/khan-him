<?php
declare(strict_types=1);
get_header();
$settings = khan_him_get_settings();
$brand = $settings['company_name'] !== '' ? $settings['company_name'] : 'Хан-Хим';
$categories = khan_him_categories_with_products();
$products = khan_him_query_products(['paged' => 1]);
$hero = get_template_directory_uri() . '/assets/hero-yard.svg';
$catalog_url = get_post_type_archive_link('product');
?>
<section class="hero">
  <div class="hero__bg" style="background-image:url('<?php echo esc_url($hero); ?>')" aria-hidden="true"></div>
  <div class="hero__veil" aria-hidden="true"></div>
  <div class="site-shell hero__content">
    <h1 class="brand-mark hero__title hero-enter"><?php echo esc_html($brand); ?></h1>
    <p class="hero__lead hero-enter-delay">Оптовые поставки химического сырья. Каталог без цен — оставьте заявку, менеджер свяжется с вами.</p>
    <div class="hero__actions hero-enter-delay">
      <a class="btn btn-hero-solid" href="<?php echo esc_url($catalog_url); ?>">Открыть каталог</a>
      <a class="btn btn-hero-ghost" href="<?php echo esc_url(home_url('/request/')); ?>">Оставить заявку</a>
    </div>
  </div>
</section>

<?php if ($categories !== []) : ?>
<section class="section">
  <div class="site-shell">
    <h2 class="section-title">Категории</h2>
    <ul class="category-links">
      <?php foreach ($categories as $term) : ?>
        <li>
          <a href="<?php echo esc_url(add_query_arg('category', $term->slug, $catalog_url)); ?>">
            <?php echo esc_html($term->name); ?>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php endif; ?>

<section class="panel-band">
  <div class="site-shell section">
    <div class="section-head">
      <h2 class="section-title">Товары</h2>
      <a href="<?php echo esc_url($catalog_url); ?>">Весь каталог</a>
    </div>
    <div class="product-grid" style="margin-top:2rem">
      <?php
      $shown = 0;
      if ($products->have_posts()) :
          while ($products->have_posts() && $shown < 8) :
              $products->the_post();
              $shown++;
              get_template_part('template-parts/product', 'card');
          endwhile;
          wp_reset_postdata();
      endif;
      ?>
    </div>
  </div>
</section>

<section class="section">
  <div class="site-shell">
    <h2 class="section-title">Как работаем</h2>
    <div class="how-grid">
      <div class="how-grid__item">
        <h3>От производителя</h3>
        <p>Прямые контракты и стабильные поставки сырья.</p>
      </div>
      <div class="how-grid__item">
        <h3>Подбор объёма</h3>
        <p>Фасовку и объём обсуждаем в заявке под ваш процесс.</p>
      </div>
      <div class="how-grid__item">
        <h3>Документы</h3>
        <p>Паспорта качества и SDS скачиваются из карточки товара.</p>
      </div>
    </div>
  </div>
</section>

<section class="cta-band">
  <div class="site-shell cta-band__inner">
    <div>
      <h2>Быстрая заявка</h2>
      <p>Напишите, что ищете и в каких объёмах — менеджер ответит.</p>
    </div>
    <a class="btn btn-hero-solid" href="<?php echo esc_url(home_url('/request/')); ?>">Оставить заявку</a>
  </div>
</section>
<?php
get_footer();
