<?php
require_once __DIR__ . '/cache_helper.php';
header('Content-Type: application/json; charset=utf-8');

// Simple authentication check (you can enhance this)
$adminToken = $_GET['token'] ?? '';
if ($adminToken !== 'admin123') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$cache = get_cache();
$cleared = $cache->clear();

echo json_encode([
    'status' => 'success',
    'message' => "Products cache cleared (home.json preserved)",
    'files_cleared' => $cleared,
    'note' => 'Only *.cache files cleared, existing home.json untouched'
], JSON_UNESCAPED_UNICODE);