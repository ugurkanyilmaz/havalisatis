<?php
/**
 * DEPRECATED: Bu dosya artık kullanılmıyor
 * Yeni konum: api/cron/keep_alive.php
 * 
 * Bu dosya root'ta kalabilir ama yeni versiyon daha iyi:
 * - .htaccess ile korumalı
 * - Daha organize (api/cron/ içinde)
 * - Log yönetimi geliştirilmiş
 * 
 * Yeni kullanım:
 * */5 * * * * /usr/bin/php /home/u2415836_keten/public_html/api/cron/keep_alive.php
 */

$siteUrl = 'https://havalielaletlerisatis.com';

function ping_url($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode;
}

// Log results
$logFile = __DIR__ . '/logs/keepalive.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);

$timestamp = date('Y-m-d H:i:s');
$results = [];

// 1. Health check
$code = ping_url("$siteUrl/api/health.php");
$results[] = "Health: $code";

// 2. Home cache
$code = ping_url("$siteUrl/api/home.php");
$results[] = "Home: $code";

// 3. Products list
$code = ping_url("$siteUrl/api/products.php?page=1&per_page=20");
$results[] = "Products: $code";

// 4. Sample category
$code = ping_url("$siteUrl/api/products.php?parent=Hava%20Tabancaları&page=1");
$results[] = "Category: $code";

$logLine = "[$timestamp] " . implode(', ', $results) . "\n";
file_put_contents($logFile, $logLine, FILE_APPEND);

echo "Keep-alive completed: " . implode(', ', $results) . "\n";
