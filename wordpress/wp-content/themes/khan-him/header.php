<?php
declare(strict_types=1);
$settings = function_exists('khan_him_get_settings') ? khan_him_get_settings() : ['company_name' => 'Хан-Хим', 'phone' => ''];
$brand = $settings['company_name'] !== '' ? $settings['company_name'] : 'Хан-Хим';
$phone = $settings['phone'] ?? '';
$phone_href = $phone !== '' ? 'tel:' . preg_replace('/[^\d+]/', '', $phone) : '';
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header">
  <div class="site-shell site-header__inner">
    <a class="brand-mark" href="<?php echo esc_url(home_url('/')); ?>" style="font-size:1.35rem;text-decoration:none;color:var(--ink)">
      <?php echo esc_html($brand); ?>
    </a>
    <nav class="site-header__nav" aria-label="Основное меню">
      <a href="<?php echo esc_url(get_post_type_archive_link('product')); ?>">Каталог</a>
      <a href="<?php echo esc_url(home_url('/about/')); ?>">О компании</a>
      <a href="<?php echo esc_url(home_url('/contacts/')); ?>">Контакты</a>
      <a href="<?php echo esc_url(home_url('/requisites/')); ?>">Реквизиты</a>
    </nav>
    <form class="site-header__search" action="<?php echo esc_url(get_post_type_archive_link('product')); ?>" method="get">
      <input class="field" type="search" name="q" value="<?php echo esc_attr((string) ($_GET['q'] ?? '')); ?>" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу">
      <button class="btn btn-primary" type="submit">Найти</button>
    </form>
    <div class="site-header__actions">
      <?php if ($phone_href !== '') : ?>
        <a class="phone" href="<?php echo esc_url($phone_href); ?>"><?php echo esc_html($phone); ?></a>
      <?php endif; ?>
      <a class="btn btn-secondary" href="<?php echo esc_url(home_url('/request/')); ?>">Быстрая заявка</a>
      <a class="btn btn-dark" data-request-link href="<?php echo esc_url(home_url('/request-list/')); ?>">Запрос</a>
    </div>
  </div>
</header>
<main class="main-wrap">
