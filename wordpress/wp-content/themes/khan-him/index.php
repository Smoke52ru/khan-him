<?php
declare(strict_types=1);
get_header();
?>
<div class="site-shell section">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    <article <?php post_class('prose'); ?>>
      <h1 class="page-title"><?php the_title(); ?></h1>
      <?php the_content(); ?>
    </article>
  <?php endwhile; else : ?>
    <h1 class="page-title">Ничего не найдено</h1>
  <?php endif; ?>
</div>
<?php
get_footer();
