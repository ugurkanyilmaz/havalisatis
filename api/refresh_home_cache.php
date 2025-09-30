<?php
// Run from CLI or by scheduler to refresh the home cache.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sanitize.php';

$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/home.json';
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);

$db = get_db();
$pdo = $db->getPdo();

function refresh_log($msg) {
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    error_log("[refresh_home] " . $msg . "\n", 3, $dir . '/api_errors.log');
}

try {
    $stmt = $pdo->prepare("SELECT id, sku, title, brand, main_img, list_price, discount, star_rating FROM products WHERE tags LIKE '%popular%' ORDER BY id DESC LIMIT 12");
    $stmt->execute();
    $popular = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT id, sku, title, brand, main_img, list_price, discount, star_rating FROM products WHERE tags LIKE '%special%' ORDER BY id DESC LIMIT 12");
    $stmt->execute();
    $special = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $payload = ['popular' => $popular, 'specialPrices' => $special];
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    $tmp = $cacheFile . '.' . uniqid('tmp', true);
    if (file_put_contents($tmp, $json) !== false) {
        @rename($tmp, $cacheFile);
        refresh_log('refreshed home cache at ' . date('c'));
        echo "OK\n";
    } else {
        refresh_log('failed to write cache file');
        echo "FAIL\n";
    }
} catch (Exception $e) {
    refresh_log('error: ' . $e->getMessage());
    echo "ERROR: " . $e->getMessage() . "\n";
}
