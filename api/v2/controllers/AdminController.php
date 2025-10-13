<?php
/**
 * Admin Controller
 * Admin operations like refreshing cache
 */

class AdminController {
    private Database $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (empty($username) || empty($password)) {
            Response::badRequest('Username and password required');
        }
        
        // Fetch user
        $user = $this->db->fetchOne(
            'SELECT * FROM users WHERE username = ? LIMIT 1',
            [$username]
        );
        
        if (!$user) {
            Response::unauthorized('Invalid credentials');
        }
        
        // Verify password
        $storedPassword = $user['password_hash'] ?? $user['password'] ?? null;
        
        if (!$storedPassword) {
            Response::unauthorized('Invalid credentials');
        }
        
        // Try password_verify first (hashed), then plain text (legacy)
        $valid = password_verify($password, $storedPassword) || 
                 hash_equals($storedPassword, $password);
        
        if (!$valid) {
            Response::unauthorized('Invalid credentials');
        }
        
        // Upgrade to hashed if needed
        if (!password_get_info($storedPassword)['algo']) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $this->db->query(
                'UPDATE users SET password_hash = ?, password = ? WHERE id = ?',
                [$newHash, $newHash, $user['id']]
            );
        }
        
        // Create session
        Auth::login([
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'] ?? 'admin',
        ]);
        
        Response::success(
            ['user' => Auth::user()],
            'Login successful'
        );
    }
    
    public function logout(): void {
        Auth::logout();
        Response::success(null, 'Logout successful');
    }
    
    public function check(): void {
        if (Auth::check()) {
            Response::success(['user' => Auth::user(), 'logged_in' => true]);
        } else {
            Response::json(['logged_in' => false]);
        }
    }
    
    public function refreshHomeCache(): void {
        Auth::require();
        
        $controller = new HomeController();
        $controller->regenerate();
    }
    
    public function clearCache(): void {
        Auth::require();
        
        $cache = new Cache();
        $cleared = $cache->clear();
        
        Response::success(
            ['files_cleared' => $cleared],
            'Cache cleared successfully'
        );
    }

    /**
     * Export all products as JSON or CSV (admin only).
     * GET params: format=json|csv (default json)
     */
    public function exportProducts(): void {
        Auth::require();

        $format = isset($_GET['format']) ? strtolower(trim($_GET['format'])) : 'json';
        $pdo = $this->db->getConnection();

        try {
            $stmt = $pdo->prepare('SELECT * FROM products ORDER BY id DESC');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $date = date('Ymd_His');
            if ($format === 'csv') {
                // Build CSV in memory
                $filename = "products-export-{$date}.csv";
                header('Content-Type: text/csv; charset=utf-8');
                header('Content-Disposition: attachment; filename=' . $filename);
                // Output UTF-8 BOM for Excel compatibility
                echo "\xEF\xBB\xBF";
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    Response::serverError('Failed to open output stream');
                }
                if (!empty($rows)) {
                    // Use first row keys as header
                    fputcsv($out, array_keys($rows[0]));
                    foreach ($rows as $r) {
                        // Ensure scalar values
                        $line = array_map(function($v) {
                            if (is_array($v) || is_object($v)) return json_encode($v, JSON_UNESCAPED_UNICODE);
                            return $v;
                        }, $r);
                        fputcsv($out, $line);
                    }
                }
                fclose($out);
                exit;
            }

            // Default: JSON download
            $filename = "products-export-{$date}.json";
            Response::json($rows, 200, ['Content-Disposition' => 'attachment; filename=' . $filename]);

        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    /**
     * Upload a single image file and return its URL.
     * Expects multipart/form-data with file field named 'file'.
     * Returns: { success: true, data: { url: '/api/v2/uploads/..' } }
     */
    public function uploadImage(): void {
        Auth::require();

        if (empty($_FILES['file'])) {
            Response::badRequest('File is required');
        }

        $file = $_FILES['file'];
        if (!empty($file['error']) && $file['error'] !== UPLOAD_ERR_OK) {
            Response::badRequest('Upload error code: ' . $file['error']);
        }

        $tmp = $file['tmp_name'] ?? null;
        $orig = $file['name'] ?? 'upload';
        // Optional existing URL or filename to replace
        $existing = $_POST['existing'] ?? $_REQUEST['existing'] ?? null;
        if (!$tmp || !file_exists($tmp)) {
            Response::badRequest('Temporary uploaded file not found');
        }

        // Basic validation for image mime types
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmp);
        finfo_close($finfo);
        $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        if (!isset($allowed[$mime])) {
            Response::badRequest('Unsupported file type: ' . $mime);
        }

        $ext = $allowed[$mime];
        $uploadsDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

        // If an existing file URL/basename is provided and it points into uploads dir,
        // overwrite that file to avoid creating duplicates.
        $dest = null;
        if (!empty($existing)) {
            // Extract basename from URL or path
            $existingBasename = basename(parse_url($existing, PHP_URL_PATH) ?: $existing);
            // sanitize
            $existingBasename = preg_replace('/[^A-Za-z0-9._-]/', '', $existingBasename);
            if ($existingBasename) {
                $maybe = $uploadsDir . '/' . $existingBasename;
                if (file_exists($maybe) && is_writable($maybe)) {
                    $dest = $maybe;
                } else {
                    // If file exists but not writable, attempt to overwrite by unlinking
                    if (file_exists($maybe)) {
                        @unlink($maybe);
                        if (!file_exists($maybe)) {
                            $dest = $maybe;
                        }
                    }
                }
            }
        }

        if ($dest === null) {
            // Generate filename
            $basename = pathinfo($orig, PATHINFO_FILENAME);
            $safeBase = preg_replace('/[^a-zA-Z0-9-_]/', '_', mb_substr($basename, 0, 50));
            $filename = $safeBase . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $dest = $uploadsDir . '/' . $filename;
        }

        if (!move_uploaded_file($tmp, $dest)) {
            // try to remove and retry
            @unlink($dest);
            if (!move_uploaded_file($tmp, $dest)) {
                Response::serverError('Failed to move uploaded file');
            }
        }

        // Build URL - try to use host info
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $finalName = basename($dest);
        $url = $scheme . '://' . $host . '/api/v2/uploads/' . $finalName;

        Response::success(['url' => $url], 'File uploaded', []);
    }

    /**
     * Delete a tag globally from products (admin only)
     * Expects JSON body: { tag: 'tagkey' }
     */
    public function deleteTag(): void {
        Auth::require();

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $tag = isset($input['tag']) ? trim((string)$input['tag']) : '';

        if ($tag === '') {
            Response::badRequest('Tag is required');
        }

        try {
            $pdo = $this->db->getConnection();
            // Fetch affected rows for reporting
            $stmt = $pdo->prepare('SELECT id, tags FROM products WHERE tags IS NOT NULL AND tags != ""');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $affected = 0;
            $updatedIds = [];

            foreach ($rows as $r) {
                $orig = $r['tags'];
                // Split by comma or semicolon
                $parts = preg_split('/[,;]+/', $orig);
                $newParts = [];
                foreach ($parts as $p) {
                    $ptrim = trim($p);
                    if ($ptrim === '') continue;
                    // Compare case-insensitive
                    if (mb_strtolower($ptrim, 'UTF-8') === mb_strtolower($tag, 'UTF-8')) continue;
                    $newParts[] = $ptrim;
                }

                $newTags = implode(', ', $newParts);
                if ($newTags !== $orig) {
                    $u = $pdo->prepare('UPDATE products SET tags = :tags WHERE id = :id');
                    $u->execute([':tags' => $newTags, ':id' => $r['id']]);
                    $affected++;
                    $updatedIds[] = $r['id'];
                }
            }

            // Clear tags cache so public endpoint recalculates
            $cache = new Cache();
            $cache->delete(Cache::key('tags'));

            Response::success(['deleted_from' => $affected, 'updated_ids' => $updatedIds], "Tag removed from {$affected} products");
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }

    /**
     * Delete a category (parent or child) from products.
     * Expects JSON: { type: 'parent'|'child', name: 'Category Name' }
     */
    public function deleteCategory(): void {
        Auth::require();

        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $type = isset($input['type']) ? $input['type'] : '';
        $name = isset($input['name']) ? trim((string)$input['name']) : '';

        if (!in_array($type, ['parent', 'child'], true) || $name === '') {
            Response::badRequest('Invalid type or name');
        }

        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare('SELECT id, parent_category, child_category FROM products');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $affected = 0;
            $updatedIds = [];

            foreach ($rows as $r) {
                $parent = $r['parent_category'] ?? '';
                $child = $r['child_category'] ?? '';
                $newParent = $parent;
                $newChild = $child;

                if ($type === 'parent') {
                    // remove the parent if matches (set to empty)
                    if (mb_strtolower($parent, 'UTF-8') === mb_strtolower($name, 'UTF-8')) {
                        $newParent = '';
                    }
                } else {
                    if (mb_strtolower($child, 'UTF-8') === mb_strtolower($name, 'UTF-8')) {
                        $newChild = '';
                    }
                }

                if ($newParent !== $parent || $newChild !== $child) {
                    $u = $pdo->prepare('UPDATE products SET parent_category = :p, child_category = :c WHERE id = :id');
                    $u->execute([':p' => $newParent, ':c' => $newChild, ':id' => $r['id']]);
                    $affected++;
                    $updatedIds[] = $r['id'];
                }
            }

            // Clear categories cache
            $cache = new Cache();
            $cache->delete(Cache::key('categories'));

            Response::success(['deleted_from' => $affected, 'updated_ids' => $updatedIds], "Category removed from {$affected} products");
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    public function bulkUpload(): void {
        Auth::require();
        
        // Get raw input
        $raw = null;
        
        // Check for file upload
        if (isset($_FILES['file'])) {
            $file = $_FILES['file'];
            
            // Check upload errors
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
                Response::badRequest($msg);
            }
            
            if (!empty($file['tmp_name']) && file_exists($file['tmp_name'])) {
                $raw = file_get_contents($file['tmp_name']);
            }
        }
        
        // Fallback to raw input
        if (!$raw) {
            $raw = file_get_contents('php://input');
        }
        
        if (!$raw) {
            Response::badRequest('No JSON payload or file provided');
        }
        
        // Parse JSON
        $data = json_decode($raw, true);
        if ($data === null) {
            // Try stripping BOM
            if (substr($raw, 0, 3) === "\xEF\xBB\xBF") {
                $raw = substr($raw, 3);
                $data = json_decode($raw, true);
            }
        }
        
        if ($data === null) {
            $err = function_exists('json_last_error_msg') ? json_last_error_msg() : json_last_error();
            Response::badRequest('Invalid JSON: ' . $err);
        }
        
        if (!is_array($data)) {
            Response::badRequest('JSON must be an array of product objects');
        }
        
        // Allowed fields
        $allowedFields = [
            'parent_category', 'child_category', 'sku', 'title', 'tags', 'discount', 'list_price', 'star_rating',
            'product_description', 'feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8',
            'brand', 'main_img', 'img1', 'img2', 'img3', 'img4', 'meta_title', 'meta_description', 'meta_keywords', 'schema_description'
        ];
        
        $inserted = 0;
        $updated = 0;
        $errors = [];
        
        $pdo = $this->db->getConnection();
        $pdo->beginTransaction();
        
        try {
            foreach ($data as $i => $prod) {
                if (!is_array($prod) || empty($prod['sku'])) {
                    $errors[] = ['index' => $i, 'error' => 'Missing sku or invalid object'];
                    continue;
                }
                
                // Build row data
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
                    $errors[] = ['index' => $i, 'error' => 'SKU blank after processing'];
                    continue;
                }
                
                // Try insert
                $fields = array_keys($row);
                $placeholders = array_map(function($f) { return ':' . $f; }, $fields);
                $sql = 'INSERT INTO products (' . implode(',', $fields) . ') VALUES (' . implode(',', $placeholders) . ')';
                
                try {
                    $stmt = $pdo->prepare($sql);
                    foreach ($row as $k => $v) {
                        $stmt->bindValue(':' . $k, $v);
                    }
                    $stmt->execute();
                    $inserted++;
                } catch (PDOException $e) {
                    // Try update on conflict
                    if (stripos($e->getMessage(), 'unique') !== false || stripos($e->getMessage(), 'constraint') !== false) {
                        // Build update excluding sku from SET clause to avoid duplicate named placeholder issues
                        $updateFieldsNonSku = array_filter($fields, function($f) { return $f !== 'sku'; });
                        if (empty($updateFieldsNonSku)) {
                            // Nothing to update (only SKU provided) - treat as updated but skip SQL
                            $updated++;
                        } else {
                            $updateFields = array_map(function($f) { return "$f = :$f"; }, $updateFieldsNonSku);
                            $updateSql = 'UPDATE products SET ' . implode(',', $updateFields) . ' WHERE sku = :sku';
                            $stmt = $pdo->prepare($updateSql);
                            // bind only non-sku fields
                            foreach ($updateFieldsNonSku as $k) {
                                $stmt->bindValue(':' . $k, $row[$k]);
                            }
                            // bind where sku
                            $stmt->bindValue(':sku', $row['sku']);
                            $stmt->execute();
                            $updated++;
                        }
                    } else {
                        $errors[] = ['index' => $i, 'error' => $e->getMessage()];
                    }
                }
            }
            
            $pdo->commit();
            
            Response::success(
                [
                    'inserted' => $inserted,
                    'updated' => $updated,
                    'errors' => $errors,
                    'total' => count($data)
                ],
                "Bulk upload completed: {$inserted} inserted, {$updated} updated"
            );
            
        } catch (Exception $e) {
            $pdo->rollBack();
            Response::error($e->getMessage());
        }
    }
    
    public function init(): void {
        // Ensure users table exists but DO NOT create any default admin user.
        // Creating default admin credentials is insecure. Operators should create
        // an admin user via a secure process (manual SQL, migration, or a protected endpoint).
        $pdo = $this->db->getConnection();

        try {
            // Create users table if not exists (MySQL compatible)
            $pdo->exec("CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(191) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            Response::success(null, 'Users table ensured. No default admin created. Create admin user securely.');

        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
