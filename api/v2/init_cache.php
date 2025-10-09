#!/usr/bin/env php
<?php
/**
 * Warm-up Script: DB + Cache Initialization
 * Keeps MySQL connection alive and regenerates cache to prevent cold start
 * 
 * Usage:
 * 1. CLI (recommended): php init_cache.php
 * 2. cPanel Cron: */5 * * * * /usr/bin/php /home/u2415836/public_html/api/v2/init_cache.php >> /home/u2415836/tmp/warmup.log 2>&1
 * 3. Web (with token): curl https://yoursite.com/api/v2/init_cache.php?token=SECRET
 */

// Allow CLI or web access with simple activation
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    // Web access - no token required, just needs ?warmup=1 parameter
    $warmup = $_GET['warmup'] ?? $_GET['WARMUP'] ?? '';
    if ($warmup !== '1') {
        http_response_code(403);
        die(json_encode(['error' => 'Add ?warmup=1 to URL']));
    }
    header('Content-Type: application/json');
}

$startTime = microtime(true);
$log = function(string $msg) use ($isCli) {
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg;
    echo $line . "\n";
    if (!$isCli) {
        @ob_flush();
        @flush();
    }
};

try {
    $log('🔥 Starting warm-up...');
    
    // Load bootstrap (this loads Database singleton)
    require_once __DIR__ . '/bootstrap.php';
    
    // Step 1: Test DB connection (warm-up MySQL)
    $log('📊 Testing database connection...');
    $db = Database::getInstance();
    $pdo = $db->getConnection();
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM products LIMIT 1');
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $productCount = $result['count'] ?? 0;
    $log("✅ Database OK (products: {$productCount})");
    
    // Step 2: Regenerate home cache
    $log('🏠 Regenerating home cache...');
    $controller = new HomeController();
    ob_start();
    $controller->regenerate();
    ob_end_clean();
    $log('✅ Home cache regenerated');
    
    // Step 3: Test cache read
    $cacheFile = __DIR__ . '/cache/home.json';
    if (file_exists($cacheFile)) {
        $size = filesize($cacheFile);
        $log("✅ Cache file exists (" . round($size/1024, 2) . " KB)");
    } else {
        $log('⚠️ Warning: Cache file not found');
    }
    
    $elapsed = round((microtime(true) - $startTime) * 1000);
    $log("🎉 Warm-up complete in {$elapsed}ms");
    
    if (!$isCli) {
        echo json_encode([
            'success' => true,
            'message' => 'Warm-up complete',
            'duration_ms' => $elapsed,
            'product_count' => $productCount,
            'timestamp' => date('c')
        ]);
    }
    
    exit(0);
    
} catch (Exception $e) {
    $elapsed = round((microtime(true) - $startTime) * 1000);
    $log("❌ Error after {$elapsed}ms: " . $e->getMessage());
    $log("Stack trace: " . $e->getTraceAsString());
    
    if (!$isCli) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'duration_ms' => $elapsed
        ]);
    }
    exit(1);
}
