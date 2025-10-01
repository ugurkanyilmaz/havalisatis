<?php
// api/upload_bulk.php
// Bulk upload/update endpoint. Matches by SKU; inserts or updates products table using provided fields (RAW mode).
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// lightweight debug logger (appends safe metadata to api/upload_debug.log)
function upload_debug_log($note, $data = []) {
    $file = __DIR__ . '/upload_debug.log';
    $time = date('Y-m-d H:i:s');
    $entry = "[{$time}] " . $note . "\n";
    foreach ($data as $k => $v) {
        $entry .= "  - {$k}: " . (is_scalar($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE)) . "\n";
    }
    $entry .= "\n";
    @file_put_contents($file, $entry, FILE_APPEND | LOCK_EX);
}

// Allow CLI testing: php api/upload_bulk.php <json_file>
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    session_start();
    if (empty($_SESSION['admin_user'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized. Admin login required.']);
        exit;
    }
}

$raw = null;
if ($isCli) {
    $arg = $argv[1] ?? null;
    if ($arg && is_file($arg)) {
        $raw = file_get_contents($arg);
    } else {
        // try default file
        $raw = @file_get_contents(__DIR__ . '/../api_first.json');
    }
} else {
    $raw = null;
    // If a multipart/form-data upload was used, check $_FILES for the uploaded file.
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        upload_debug_log('FILES present', [
            'name' => $file['name'] ?? null,
            'type' => $file['type'] ?? null,
            'tmp_name' => $file['tmp_name'] ?? null,
            'error' => $file['error'] ?? null,
            'size' => $file['size'] ?? null,
        ]);
        // If there was an upload error, return an explicit message to help debugging.
        if (!empty($file['error']) && $file['error'] !== UPLOAD_ERR_OK) {
            $errMap = [
                UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds upload_max_filesize.',
                UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive.',
                UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded.',
                UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
                UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on server.',
                UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
                UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
            ];
            $msg = $errMap[$file['error']] ?? ('Unknown upload error code: ' . $file['error']);
            http_response_code(400);
            echo json_encode(['error' => 'File upload error.', 'upload_error' => $msg]);
            exit;
        }

        // If tmp_name exists and the file is present on disk, use it. Some setups
        // may make is_uploaded_file() return false, but the tmp file can still exist.
        if (!empty($file['tmp_name']) && file_exists($file['tmp_name'])) {
            $raw = file_get_contents($file['tmp_name']);
        }
    }

    // Fallback: read raw input (used for application/json requests).
    if (!$raw) {
        $raw = file_get_contents('php://input');
        // If php://input looks like a multipart payload but we do have a tmp file,
        // prefer the tmp file's contents.
        if ($raw && preg_match('/----WebKitFormBoundary|multipart\/form-data|boundary=/', substr($raw, 0, 200)) && isset($_FILES['file']) && !empty($_FILES['file']['tmp_name']) && file_exists($_FILES['file']['tmp_name'])) {
            $raw = file_get_contents($_FILES['file']['tmp_name']);
        }
    }
}

// Log raw payload info (length and small preview) to help debugging
$rawPreview = is_string($raw) ? base64_encode(substr($raw,0,200)) : '';
upload_debug_log('Raw payload info', [
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? '',
    'raw_bytes' => is_string($raw) ? strlen($raw) : 0,
    'raw_preview_b64' => $rawPreview,
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
]);

if (!$raw) {
    http_response_code(400);
    echo json_encode(['error' => 'No JSON payload or file provided.']);
    exit;
}

// Try to defensive-handle common encoding issues (BOM) and give a helpful error message
$data = json_decode($raw, true);
if ($data === null) {
    // strip UTF-8 BOM if present and retry
    if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
        $raw = substr($raw, 3);
        $data = json_decode($raw, true);
    }
}
if ($data === null) {
    http_response_code(400);
    // include PHP json error message to help debug invalid payloads
    $err = function_exists('json_last_error_msg') ? json_last_error_msg() : json_last_error();
    // Provide a small base64-encoded preview of the raw payload to help debugging binary/multipart issues.
    $preview = '';
    if (is_string($raw) && strlen($raw) > 0) {
        $preview = base64_encode(substr($raw, 0, 200));
    }
    echo json_encode(['error' => 'Invalid JSON.', 'json_error' => $err, 'raw_preview_b64' => $preview]);
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

$db = get_db();
$pdo = $db->getPdo();

$inserted = 0; $updated = 0; $errors = [];
$pdo->beginTransaction();
try {
    foreach ($data as $i => $prod) {
        if (!is_array($prod) || empty($prod['sku'])) {
            $errors[] = ['index'=>$i,'error'=>'Missing sku or invalid object'];
            continue;
        }

        // RAW mode: include incoming fields as-is. Arrays/objects are JSON-encoded.
        $row = [];
        foreach ($allowedFields as $f) {
            if (!array_key_exists($f, $prod)) continue;
            $rawVal = $prod[$f];
            if (is_array($rawVal) || is_object($rawVal)) {
                $row[$f] = json_encode($rawVal, JSON_UNESCAPED_UNICODE);
            } else {
                $row[$f] = $rawVal;
            }
        }

        if (empty($row['sku'])) {
            $errors[] = ['index'=>$i,'error'=>'SKU blank after processing'];
            continue;
        }

        $fields = array_keys($row);
        $placeholders = array_map(function($f){ return ':' . $f; }, $fields);
        $sql = 'INSERT INTO products (' . implode(',', $fields) . ') VALUES (' . implode(',', $placeholders) . ')';
        try {
            $stmt = $pdo->prepare($sql);
            foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
            $stmt->execute();
            $inserted++;
        } catch (PDOException $e) {
            // Try update by sku
            if (stripos($e->getMessage(), 'unique') !== false || stripos($e->getMessage(), 'constraint') !== false) {
                $updateFields = array_map(function($f){ return "$f = :$f"; }, $fields);
                $updateSql = 'UPDATE products SET ' . implode(',', $updateFields) . ' WHERE sku = :sku';
                $stmt = $pdo->prepare($updateSql);
                foreach ($row as $k => $v) $stmt->bindValue(':' . $k, $v);
                $stmt->bindValue(':sku', $row['sku']);
                $stmt->execute();
                $updated++;
            } else {
                $errors[] = ['index'=>$i,'error'=>$e->getMessage()];
            }
        }
    }
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error'=>$e->getMessage()]);
    exit;
}

echo json_encode(['inserted'=>$inserted,'updated'=>$updated,'errors'=>$errors], JSON_UNESCAPED_UNICODE);

