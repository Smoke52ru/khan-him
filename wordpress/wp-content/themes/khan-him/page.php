<?php
declare(strict_types=1);
get_header();
the_post();
$slug = get_post_field('post_name', get_post());
?>
<div class="site-shell section <?php echo in_array($slug, ['contacts', 'requisites', 'request-list'], true) ? 'page-narrow' : ($slug === 'request' ? 'page-form' : ''); ?>">
  <?php if ($slug === 'request') : ?>
    <?php
    $items = [];
    $title = 'Быстрая заявка';
    $source = 'quick';
    if (isset($_GET['product'])) {
        $pid = (int) $_GET['product'];
        $p = get_post($pid);
        if ($p instanceof WP_Post && $p->post_type === 'product' && $p->post_status === 'publish') {
            $items[] = [
                'productId' => (string) $pid,
                'name' => get_the_title($p),
                'sku' => khan_him_product_meta($pid, 'sku'),
            ];
            $source = 'price';
            $title = 'Запросить цену: ' . get_the_title($p);
        }
    }
    ?>
    <h1 class="page-title" style="font-size:clamp(1.85rem,3.5vw,2.5rem)"><?php echo esc_html($title); ?></h1>
    <p class="page-lead">Это предварительная заявка. Укажите адрес доставки, объём и фасовку в комментарии.</p>
    <div style="margin-top:2rem">
      <?php get_template_part('template-parts/request', 'form', ['source' => $source, 'items' => $items]); ?>
    </div>
  <?php elseif ($slug === 'request-list') : ?>
    <h1 class="page-title" style="font-size:clamp(1.85rem,3.5vw,2.5rem)">Список запроса</h1>
    <p class="page-lead">Укажите объём и фасовку для каждой позиции и отправьте заявку.</p>
    <div id="request-list-root" style="margin-top:2rem">
      <div class="empty-panel" data-request-empty>
        <p><strong>Список пуст.</strong></p>
        <p>Добавьте товары из каталога.</p>
      </div>
      <ul class="request-cards" data-request-cards hidden></ul>
      <p data-request-missing class="form-error" hidden></p>
    </div>
    <div data-request-form-wrap style="margin-top:2rem" hidden>
      <?php get_template_part('template-parts/request', 'form', ['source' => 'list']); ?>
    </div>
  <?php else : ?>
    <h1 class="page-title"><?php the_title(); ?></h1>
    <?php if ($slug === 'contacts') : ?>
      <?php $s = khan_him_get_settings(); ?>
      <dl class="field-list field-list--short">
        <?php if ($s['phone'] !== '') : ?>
          <div class="field-list__row">
            <dt>Телефон</dt>
            <dd><a class="field-list__link" href="tel:<?php echo esc_attr(preg_replace('/[^\d+]/', '', $s['phone'])); ?>"><?php echo esc_html($s['phone']); ?></a></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['email'] !== '') : ?>
          <div class="field-list__row">
            <dt>Email</dt>
            <dd><a class="field-list__link" href="mailto:<?php echo esc_attr($s['email']); ?>"><?php echo esc_html($s['email']); ?></a></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['address'] !== '') : ?>
          <div class="field-list__row">
            <dt>Адрес</dt>
            <dd><?php echo esc_html($s['address']); ?></dd>
          </div>
        <?php endif; ?>
      </dl>
    <?php elseif ($slug === 'requisites') : ?>
      <?php $s = khan_him_get_settings(); ?>
      <dl class="field-list">
        <?php if ($s['company_name'] !== '') : ?>
          <div class="field-list__row">
            <dt>Название</dt>
            <dd style="font-weight:600"><?php echo esc_html($s['company_name']); ?></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['inn'] !== '') : ?>
          <div class="field-list__row">
            <dt>ИНН</dt>
            <dd class="is-mono"><?php echo esc_html($s['inn']); ?></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['ogrn'] !== '') : ?>
          <div class="field-list__row">
            <dt>ОГРН</dt>
            <dd class="is-mono"><?php echo esc_html($s['ogrn']); ?></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['kpp'] !== '') : ?>
          <div class="field-list__row">
            <dt>КПП</dt>
            <dd class="is-mono"><?php echo esc_html($s['kpp']); ?></dd>
          </div>
        <?php endif; ?>
        <?php if ($s['legal_address'] !== '') : ?>
          <div class="field-list__row">
            <dt>Юридический адрес</dt>
            <dd><?php echo esc_html($s['legal_address']); ?></dd>
          </div>
        <?php endif; ?>
      </dl>
    <?php else : ?>
      <?php
      $content = trim((string) get_post_field('post_content', get_post()));
      if ($content !== '') {
          echo '<div class="prose">';
          the_content();
          echo '</div>';
      }
      ?>
    <?php endif; ?>
  <?php endif; ?>
</div>
<?php
get_footer();
