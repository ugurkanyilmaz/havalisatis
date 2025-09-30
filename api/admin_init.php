<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
$db = get_db();
$pdo = $db->getPdo();

try {
    // Create users table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // If any user exists, don't seed
    $stmt = $pdo->query('SELECT COUNT(*) FROM users');
    $count = intval($stmt->fetchColumn());
    if ($count > 0) {
        echo json_encode(['status' => 'ok', 'message' => 'users table ready']);
        return;
    }

    // Read JSON body for seed credentials (optional)
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $username = isset($body['username']) ? trim($body['username']) : 'admin';
    $password = isset($body['password']) ? $body['password'] : 'admin123';

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role) VALUES (:u, :p, :r)');
    $stmt->execute([':u' => $username, ':p' => $hash, ':r' => 'admin']);

    echo json_encode(['status' => 'ok', 'message' => 'admin created', 'username' => $username]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
