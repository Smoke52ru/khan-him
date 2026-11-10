<?php

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Transliterate by GOST 7.79 (system B) into a kebab-case slug.
 */
function khan_him_slugify(string $input): string
{
    static $map = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'yo',
        'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'j', 'к' => 'k', 'л' => 'l', 'м' => 'm',
        'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',
        'ф' => 'f', 'х' => 'x', 'ц' => 'c', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'shh', 'ъ' => '',
        'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
    ];

    $lower = mb_strtolower(trim($input), 'UTF-8');
    $out = '';
    $len = mb_strlen($lower, 'UTF-8');
    for ($i = 0; $i < $len; $i++) {
        $char = mb_substr($lower, $i, 1, 'UTF-8');
        if (array_key_exists($char, $map)) {
            $out .= $map[$char];
            continue;
        }
        if (preg_match('/[a-z0-9]/u', $char)) {
            $out .= $char;
            continue;
        }
        $out .= '-';
    }

    $out = preg_replace('/-+/', '-', $out) ?? '';
    return trim($out, '-');
}

/**
 * Pick a unique slug, appending -2, -3, … when needed.
 *
 * @param list<string> $existing
 */
function khan_him_unique_slug(string $base, array $existing): string
{
    $taken = array_fill_keys($existing, true);
    if ($base !== '' && !isset($taken[$base])) {
        return $base;
    }
    $n = 2;
    while (isset($taken["{$base}-{$n}"])) {
        $n++;
    }
    return $base === '' ? (string) $n : "{$base}-{$n}";
}
