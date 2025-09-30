<?php
// api/update_product.php
// Update or insert a single product by SKU. Accepts JSON body { sku: ..., ...fields }
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    session_start();
    if (empty($_SESSION['admin_user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized. Admin login required.']);
        exit;
    }
}

$raw = $isCli ? (file_get_contents($argv[1] ?? '') ?: null) : file_get_contents('php://input');
if (!$raw) {
    http_response_code(400);
    echo json_encode(['error'=>'No JSON payload provided']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data) || empty($data['sku'])) {
    http_response_code(400);
    echo json_encode(['error'=>'Invalid JSON or missing sku']);
    exit;
}

$allowedFields = [
    'parent_category','child_category','sku','title','tags','discount','list_price','star_rating',
    'product_description','feature1','feature2','feature3','feature4','feature5','feature6','feature7','feature8',
    'brand','main_img','img1','img2','img3','img4','meta_title','meta_description','schema_description'
];

$row = [];
foreach ($allowedFields as $f) {
    if (!array_key_exists($f, $data)) continue;
    $v = $data[$f];
    if (is_array($v) || is_object($v)) $row[$f] = json_encode($v, JSON_UNESCAPED_UNICODE);
    else $row[$f] = $v;
}

$db = get_db();
$pdo = $db->getPdo();

// Try update first; if no rows affected, insert
try {
    if (!empty($row)) {
        $updateFields = array_map(function($f){ return "$f = :$f"; }, array_keys($row));
        $sql = 'UPDATE products SET ' . implode(',', $updateFields) . ' WHERE sku = :sku';
        $stmt = $pdo->prepare($sql);
        foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
        $stmt->bindValue(':sku', $data['sku']);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            echo json_encode(['status'=>'updated','sku'=>$data['sku']], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Insert fallback: include sku
    $row['sku'] = $data['sku'];
    $fields = array_keys($row);
    $placeholders = array_map(function($f){ return ':' . $f; }, $fields);
    $sql = 'INSERT INTO products (' . implode(',', $fields) . ') VALUES (' . implode(',', $placeholders) . ')';
    $stmt = $pdo->prepare($sql);
    foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
    $stmt->execute();
    echo json_encode(['status'=>'inserted','sku'=>$data['sku']], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>$e->getMessage()]);
}
