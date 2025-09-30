<?php
require_once __DIR__ . '/db.php';
session_start();
header('Content-Type: application/json; charset=utf-8');
$db = get_db();
$pdo = $db->getPdo();

try {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $username = isset($body['username']) ? trim($body['username']) : '';
    $password = isset($body['password']) ? $body['password'] : '';
    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'username and password required']);
        exit;
    }

    // Fetch user data
    $stmt = $pdo->prepare('SELECT id, username, password, role FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid credentials']);
        exit;
    }

    $storedPassword = isset($row['password']) ? $row['password'] : null;

    // Plain-text password comparison
    $authenticated = false;
    if ($storedPassword !== null && hash_equals((string)$storedPassword, (string)$password)) {
        $authenticated = true;
    }

    if (!$authenticated) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid credentials']);
        exit;
    }

    // Auth success
    $_SESSION['admin_user'] = ['id' => $row['id'], 'username' => $row['username'], 'role' => $row['role']];
    echo json_encode(['status' => 'ok', 'user' => $_SESSION['admin_user']]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
