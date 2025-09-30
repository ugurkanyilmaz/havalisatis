<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sanitize.php';

header('Content-Type: application/json; charset=utf-8');

$db = get_db();
$pdo = $db->getPdo();

$sku = isset($_GET['sku']) ? clean_sku($_GET['sku']) : null;

function list_log($msg) {
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    error_log("[list] " . $msg . "\n", 3, $dir . '/api_errors.log');
}

function is_transient_db_error_list($e) {
    if (!$e) return false;
    $msg = strtolower($e->getMessage());
    $transients = ['database is locked', 'busy', 'i/o error', 'unable to open database file'];
    foreach ($transients as $t) if (strpos($msg, $t) !== false) return true;
    return false;
}

$maxAttempts = 3;
for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
    try {
        if ($sku) {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE sku = :sku');
            $stmt->execute([':sku' => $sku]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($row ?: null, JSON_UNESCAPED_UNICODE);
        } else {
            $stmt = $pdo->query('SELECT * FROM products ORDER BY id DESC');
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($rows, JSON_UNESCAPED_UNICODE);
        }
        break;
    } catch (Exception $e) {
        if ($attempt < $maxAttempts && is_transient_db_error_list($e)) {
            list_log("transient error attempt {$attempt}: " . $e->getMessage());
            usleep(200000);
            continue;
        }
        list_log("fatal error on attempt {$attempt}: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        break;
    }
}
