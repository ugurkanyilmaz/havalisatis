<?php
// Bulk JSON upload endpoint
require_once __DIR__ . '/db.php';

// Require admin session: do not allow unauthenticated uploads
session_start();
header('Content-Type: application/json; charset=utf-8');
if (empty($_SESSION['admin_user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Admin login required.']);
    exit;
}

$db = get_db();
$pdo = $db->getPdo();

// Read raw body
$raw = file_get_contents('php://input');
if (!$raw && isset($_FILES['file'])) {
    $raw = file_get_contents($_FILES['file']['tmp_name']);
}

if (!$raw) {
    http_response_code(400);
    echo json_encode(['error' => 'No JSON payload or file provided.']);
    exit;
}

$data = json_decode($raw, true);
if ($data === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON.']);
    exit;
}

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON must be an array of product objects.']);
    exit;
}

$allowedFields = [
    'parent_category','child_category','sku','title','tags','discount','list_price','star_rating',
    'product_description','feature1','feature2','feature3','feature4','feature5','feature6','feature7','feature8',
    'brand','main_img','img1','img2','img3','img4','meta_title','meta_description','schema_description'
];

$inserted = 0; $updated = 0; $errors = [];

$pdo->beginTransaction();
try {
    foreach ($data as $i => $prod) {
        if (!is_array($prod) || empty($prod['sku'])) {
            $errors[] = [ 'index' => $i, 'error' => 'Missing sku or invalid object' ];
            continue;
        }

        // Normalize fields
        $row = [];
        foreach ($allowedFields as $f) {
            $row[$f] = array_key_exists($f, $prod) ? $prod[$f] : null;
        }

        // Prepare insert
        $fields = array_keys($row);
        $placeholders = array_map(function($f){ return ':' . $f; }, $fields);
        $sql = "INSERT INTO products (" . implode(',', $fields) . ") VALUES (" . implode(',', $placeholders) . ")";

        try {
            $stmt = $pdo->prepare($sql);
            foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
            $stmt->execute();
            $inserted++;
        } catch (PDOException $e) {
            // If exists, update
            if (strpos($e->getMessage(), 'UNIQUE') !== false) {
                $updateFields = array_map(function($f){ return "$f = :$f"; }, $fields);
                $updateSql = "UPDATE products SET " . implode(',', $updateFields) . " WHERE sku = :sku";
                $stmt = $pdo->prepare($updateSql);
                foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
                $stmt->execute();
                $updated++;
            } else {
                $errors[] = [ 'index' => $i, 'error' => $e->getMessage() ];
            }
        }
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

echo json_encode(['inserted' => $inserted, 'updated' => $updated, 'errors' => $errors], JSON_UNESCAPED_UNICODE);
