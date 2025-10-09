<?php
/**
 * Quick DB connectivity test (temporary)
 * Upload to server and open /api/v2/test_db.php
 * IMPORTANT: Remove this file after testing.
 */

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$result = [
    'status' => 'unknown',
    'dsn' => null,
    'error' => null,
];

try {
    $config = require __DIR__ . '/config/database.php';
    $result['dsn'] = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $config['database'],
        $config['charset']
    );

    $db = Database::getInstance();
    $pdo = $db->getPdo();
    $stmt = $pdo->query('SELECT 1');
    $ok = $stmt->fetchColumn();

    $result['status'] = ($ok == 1) ? 'ok' : 'unexpected';
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    $result['status'] = 'error';
    $result['error'] = $e->getMessage();
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
