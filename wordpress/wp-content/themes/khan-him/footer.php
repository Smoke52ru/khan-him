<?php
declare(strict_types=1);
$settings = function_exists('khan_him_get_settings') ? khan_him_get_settings() : [];
?>
</main>
<footer class="site-footer">
  <div class="site-shell site-footer__grid">
    <div>
      <p class="brand-mark" style="font-size:1.25rem;margin:0"><?php echo esc_html($settings['company_name'] ?? 'Хан-Хим'); ?></p>
      <?php if (!empty($settings['phone'])) : ?>
        <p style="margin:0.75rem 0 0;font-size:0.875rem"><?php echo esc_html($settings['phone']); ?></p>
      <?php endif; ?>
      <?php if (!empty($settings['email'])) : ?>
        <p style="margin:0;font-size:0.875rem">
          <a href="mailto:<?php echo esc_attr($settings['email']); ?>" style="color:var(--signal-ink)"><?php echo esc_html($settings['email']); ?></a>
        </p>
      <?php endif; ?>
      <?php if (!empty($settings['address'])) : ?>
        <p style="margin:0.75rem 0 0;max-width:20rem;font-size:0.875rem;color:var(--ink-soft)"><?php echo esc_html($settings['address']); ?></p>
      <?php endif; ?>
    </div>
    <div class="site-footer__meta">
      <?php if (!empty($settings['inn'])) : ?><p style="margin:0">ИНН <?php echo esc_html($settings['inn']); ?></p><?php endif; ?>
      <?php if (!empty($settings['ogrn'])) : ?><p style="margin:0">ОГРН <?php echo esc_html($settings['ogrn']); ?></p><?php endif; ?>
      <?php if (!empty($settings['kpp'])) : ?><p style="margin:0">КПП <?php echo esc_html($settings['kpp']); ?></p><?php endif; ?>
      <?php if (!empty($settings['legal_address'])) : ?>
        <p style="margin:0.75rem 0 0;font-family:var(--font-sans)"><?php echo esc_html($settings['legal_address']); ?></p>
      <?php endif; ?>
    </div>
    <div class="site-footer__links">
      <a href="<?php echo esc_url(get_post_type_archive_link('product')); ?>">Каталог</a>
      <a href="<?php echo esc_url(home_url('/privacy/')); ?>">Политика конфиденциальности</a>
      <a href="<?php echo esc_url(home_url('/pd-consent/')); ?>">Согласие на обработку ПДн</a>
    </div>
  </div>
  <div class="site-footer__disclaimer">
    <div class="site-shell">
      <?php khan_him_offer_disclaimer(); ?>
    </div>
  </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
