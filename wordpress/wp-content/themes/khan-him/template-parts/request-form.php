<?php
declare(strict_types=1);
$source = $args['source'] ?? 'quick';
$preset_items = $args['items'] ?? [];
$flash = function_exists('khan_him_consume_form_flash') ? khan_him_consume_form_flash() : null;
$notice = function_exists('khan_him_consume_notice') ? khan_him_consume_notice() : null;
$values = is_array($flash['values'] ?? null) ? $flash['values'] : [];
$errors = is_array($flash['errors'] ?? null) ? $flash['errors'] : [];
$name = (string) ($values['name'] ?? '');
$phone = (string) ($values['phone'] ?? '');
$email = (string) ($values['email'] ?? '');
$message = (string) ($values['message'] ?? '');
$opened_at = (int) round(microtime(true) * 1000);
?>
<?php if (isset($_GET['request_sent'])) : ?>
  <div class="form-notice">Заявка принята. Менеджер свяжется с вами.</div>
<?php endif; ?>
<?php if ($notice) : ?>
  <div class="form-notice <?php echo ($notice['type'] ?? '') === 'error' ? 'error' : ''; ?>">
    <?php echo esc_html((string) ($notice['message'] ?? '')); ?>
    <?php
    $settings = khan_him_get_settings();
    if (($notice['type'] ?? '') === 'error' && !empty($settings['phone'])) {
        echo ' Телефон: ' . esc_html($settings['phone']);
    }
    ?>
  </div>
<?php endif; ?>

<form class="form-stack" method="post" action="" data-request-form>
  <input type="hidden" name="khan_him_request" value="1">
  <?php wp_nonce_field('khan_him_submit_request', 'khan_him_request_nonce'); ?>
  <input type="hidden" name="source" value="<?php echo esc_attr($source); ?>">
  <input type="hidden" name="form_opened_at" value="<?php echo (int) $opened_at; ?>">
  <label class="honeypot">Сайт<input type="text" name="website" tabindex="-1" autocomplete="off"></label>

  <?php if ($source === 'list') : ?>
    <div data-request-form-items></div>
  <?php elseif ($preset_items !== []) : ?>
    <?php foreach ($preset_items as $i => $item) : ?>
      <input type="hidden" name="items[<?php echo (int) $i; ?>][productId]" value="<?php echo esc_attr((string) ($item['productId'] ?? '')); ?>">
      <input type="hidden" name="items[<?php echo (int) $i; ?>][name]" value="<?php echo esc_attr((string) ($item['name'] ?? '')); ?>">
      <input type="hidden" name="items[<?php echo (int) $i; ?>][sku]" value="<?php echo esc_attr((string) ($item['sku'] ?? '')); ?>">
      <input type="hidden" name="items[<?php echo (int) $i; ?>][quantity]" value="">
    <?php endforeach; ?>
  <?php endif; ?>

  <div>
    <label>Имя
      <input class="field" type="text" name="name" required value="<?php echo esc_attr($name); ?>">
    </label>
    <?php if (!empty($errors['name'])) : ?><p class="form-error"><?php echo esc_html($errors['name']); ?></p><?php endif; ?>
  </div>
  <div>
    <label>Телефон
      <input class="field" type="tel" name="phone" required value="<?php echo esc_attr($phone); ?>">
    </label>
    <?php if (!empty($errors['phone'])) : ?><p class="form-error"><?php echo esc_html($errors['phone']); ?></p><?php endif; ?>
  </div>
  <div>
    <label>Email
      <input class="field" type="email" name="email" value="<?php echo esc_attr($email); ?>">
    </label>
    <?php if (!empty($errors['email'])) : ?><p class="form-error"><?php echo esc_html($errors['email']); ?></p><?php endif; ?>
  </div>
  <div>
    <label>Сообщение
      <textarea class="field" name="message" placeholder="Напишите, что ищете и в каких объёмах"><?php echo esc_textarea($message); ?></textarea>
    </label>
    <?php if (!empty($errors['message'])) : ?><p class="form-error"><?php echo esc_html($errors['message']); ?></p><?php endif; ?>
  </div>
  <label>
    <input type="checkbox" name="privacy_consent" value="1">
    Согласен с <a href="<?php echo esc_url(home_url('/privacy/')); ?>" target="_blank" rel="noopener">политикой конфиденциальности</a>
  </label>
  <?php if (!empty($errors['privacy_consent'])) : ?><p class="form-error"><?php echo esc_html($errors['privacy_consent']); ?></p><?php endif; ?>
  <label>
    <input type="checkbox" name="pd_consent" value="1">
    Согласен на <a href="<?php echo esc_url(home_url('/pd-consent/')); ?>" target="_blank" rel="noopener">обработку персональных данных</a>
  </label>
  <?php if (!empty($errors['pd_consent'])) : ?><p class="form-error"><?php echo esc_html($errors['pd_consent']); ?></p><?php endif; ?>
  <button class="btn btn-primary" type="submit">Отправить заявку</button>
</form>
