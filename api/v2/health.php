<?php
/**
 * API v2 - Health Check Endpoint
 * Keeps server and DB connection warm
 * 
 * GET /api/v2/health.php
 */

require_once __DIR__ . '/bootstrap.php';

$startTime = microtime(true);
$checks = [];
$pdo = null;

// Check 1: Database Connection
try {
    $db = Database::getInstance();
    $pdo = $db->getPdo();
    $stmt = $pdo->query('SELECT 1');
    $checks['database'] = [
        'status' => 'ok',
        'response_time' => round((microtime(true) - $startTime) * 1000, 2) . 'ms'
    ];
} catch (Exception $e) {
    $checks['database'] = [
        'status' => 'error',
        'message' => $e->getMessage()
    ];
    http_response_code(503);
}

// Check 2: Cache Directory
$cacheDir = __DIR__ . '/cache';
if (is_dir($cacheDir) && is_writable($cacheDir)) {
    $checks['cache'] = ['status' => 'ok', 'writable' => true];
} else {
    $checks['cache'] = ['status' => 'warning', 'writable' => false];
}

// Check 3: Products Table (warm up query cache) — only if DB ok
if ($pdo instanceof PDO) {
    try {
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM products LIMIT 1');
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $checks['products'] = [
            'status' => 'ok',
            'total_count' => (int)($result['count'] ?? 0)
        ];
    } catch (Exception $e) {
        $checks['products'] = [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
} else {
    $checks['products'] = [
        'status' => 'skipped',
        'message' => 'Database not available'
    ];
}

$totalTime = round((microtime(true) - $startTime) * 1000, 2);
$allOk = ($checks['database']['status'] ?? '') === 'ok';

Response::json([
    'status' => $allOk ? 'healthy' : 'unhealthy',
    'timestamp' => date('c'),
    'response_time' => $totalTime . 'ms',
    'checks' => $checks
], $allOk ? 200 : 503);
