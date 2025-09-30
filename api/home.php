<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sanitize.php';
header('Content-Type: application/json; charset=utf-8');

// Serve cached home payload when available to reduce DB load and avoid first-request flakiness.
$cacheDir = __DIR__ . '/cache';
$cacheFile = $cacheDir . '/home.json';
$cacheTtl = 60; // seconds; adjust as needed

// ensure directories exist
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0755, true);
$db = get_db();
$pdo = $db->getPdo();

// simple logger
function home_log($msg) {
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    error_log("[home] " . $msg . "\n", 3, $dir . '/api_errors.log');
}

// If cache exists and is fresh, serve it
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
    readfile($cacheFile);
    exit;
}

// Otherwise, build payload and write atomically to cache then serve
try {
    $stmt = $pdo->prepare("SELECT id, sku, title, brand, main_img, list_price, discount, star_rating FROM products WHERE tags LIKE '%popular%' ORDER BY id DESC LIMIT 12");
    $stmt->execute();
    $popular = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("SELECT id, sku, title, brand, main_img, list_price, discount, star_rating FROM products WHERE tags LIKE '%special%' ORDER BY id DESC LIMIT 12");
    $stmt->execute();
    $special = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $payload = ['popular' => $popular, 'specialPrices' => $special];
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    // atomic write
    $tmp = $cacheFile . '.' . uniqid('tmp', true);
    if (file_put_contents($tmp, $json) !== false) {
        @rename($tmp, $cacheFile);
    } else {
        @unlink($tmp);
        home_log('failed to write cache file');
    }

    echo $json;
} catch (Exception $e) {
    home_log('error building home payload: ' . $e->getMessage());
    // if cache exists, fall back to it even if stale
    if (file_exists($cacheFile)) {
        readfile($cacheFile);
        exit;
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
