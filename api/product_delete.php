<?php
require_once __DIR__ . '/db.php';
session_start();
header('Content-Type: application/json; charset=utf-8');
if (empty($_SESSION['admin_user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];
$sku = isset($data['sku']) ? trim($data['sku']) : '';
if ($sku === '') { http_response_code(400); echo json_encode(['error' => 'sku required']); exit; }

$db = get_db(); $pdo = $db->getPdo();
try {
    $stmt = $pdo->prepare('DELETE FROM products WHERE sku = :sku');
    $stmt->execute([':sku' => $sku]);
    echo json_encode(['status' => 'ok', 'deleted' => $stmt->rowCount()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
