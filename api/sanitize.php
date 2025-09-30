<?php
// Lightweight input sanitization helpers for this app.
// Keep server-side validation simple and strict to avoid SQL-injection and malformed inputs.

function clean_string($v, $maxLen = 200) {
    if ($v === null) return null;
    $s = (string)$v;
    // remove control characters except common whitespace
    $s = preg_replace('/[\x00-\x1F\x7F]/u', '', $s);
    $s = trim($s);
    if ($maxLen > 0 && mb_strlen($s, 'UTF-8') > $maxLen) $s = mb_substr($s, 0, $maxLen, 'UTF-8');
    return $s === '' ? null : $s;
}

function clean_sku($v) {
    if ($v === null) return null;
    $s = (string)$v;
    $s = trim($s);
    // allow common SKU chars: letters, numbers, dash, underscore, dot
    if (preg_match('/^[A-Za-z0-9._\-]{1,64}$/', $s)) return $s;
    // otherwise strip disallowed chars
    $s2 = preg_replace('/[^A-Za-z0-9._\-]/', '', $s);
    return $s2 === '' ? null : mb_substr($s2, 0, 64, 'UTF-8');
}

function clean_int($v, $min = null, $max = null, $default = null) {
    if ($v === null || $v === '') return $default;
    if (!is_numeric($v)) return $default;
    $i = intval($v);
    if ($min !== null && $i < $min) $i = $min;
    if ($max !== null && $i > $max) $i = $max;
    return $i;
}

function allow_alpha_numeric_space($v, $maxLen = 100) {
    if ($v === null) return null;
    $s = clean_string($v, $maxLen);
    if ($s === null) return null;
    // allow letters, numbers, spaces, dash, underscore
    $s = preg_replace('/[^\p{L}\p{N} _\-\.]/u', '', $s);
    return $s === '' ? null : $s;
}

?>
