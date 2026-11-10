<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

const KHAN_HIM_IMAGE_MAX = 10 * 1024 * 1024;
const KHAN_HIM_DOC_MAX = 20 * 1024 * 1024;

/**
 * @return list<string>
 */
function khan_him_image_mimes(): array
{
    return ['image/jpeg', 'image/png', 'image/webp'];
}

/**
 * @return list<string>
 */
function khan_him_document_mimes(): array
{
    return [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
}

add_filter('wp_handle_upload_prefilter', static function (array $file): array {
    $type = (string) ($file['type'] ?? '');
    $size = (int) ($file['size'] ?? 0);
    $name = (string) ($file['name'] ?? '');

    $looks_like_image = str_starts_with($type, 'image/')
        || (bool) preg_match('/\.(jpe?g|png|webp|gif|bmp|svg|avif|tiff?)$/i', $name);
    $is_allowed_image = in_array($type, khan_him_image_mimes(), true)
        || (bool) preg_match('/\.(jpe?g|png|webp)$/i', $name);
    $is_doc = in_array($type, khan_him_document_mimes(), true)
        || (bool) preg_match('/\.(pdf|docx?|xlsx?)$/i', $name);

    if ($looks_like_image) {
        if (!$is_allowed_image) {
            $file['error'] = 'Допустимы только JPEG, PNG или WebP.';
            return $file;
        }
        if ($size > KHAN_HIM_IMAGE_MAX) {
            $file['error'] = 'Фото больше 10 МБ.';
            return $file;
        }
        return $file;
    }

    if ($is_doc) {
        if ($size > KHAN_HIM_DOC_MAX) {
            $file['error'] = 'Документ больше 20 МБ.';
            return $file;
        }
        return $file;
    }

    return $file;
});
