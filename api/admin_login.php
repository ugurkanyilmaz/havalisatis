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

    // Fetch user data. Select both possible columns (new password_hash and legacy password) if present.
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid credentials']);
        exit;
    }

    // Support both schema variants: prefer password_hash, fall back to legacy password
    $storedPassword = null;
    if ($row) {
        if (array_key_exists('password_hash', $row) && $row['password_hash'] !== null) $storedPassword = $row['password_hash'];
        elseif (array_key_exists('password', $row) && $row['password'] !== null) $storedPassword = $row['password'];
    }

    // Authenticate: prefer password_hash()/password_verify().
    // Fall back to legacy plain-text comparison if the stored value is not a hash.
    $authenticated = false;
    if ($storedPassword !== null) {
        // If stored password looks like a hash, use password_verify
        if (password_verify($password, $storedPassword)) {
            $authenticated = true;
        } elseif (hash_equals((string)$storedPassword, (string)$password)) {
            // Legacy plaintext match — accept but upgrade to a secure hash
            $authenticated = true;
            try {
                $newHash = password_hash($password, PASSWORD_DEFAULT);
                // Prefer to update password_hash column if it exists, otherwise update password
                if (array_key_exists('password_hash', $row)) {
                    $upd = $pdo->prepare('UPDATE users SET password_hash = :p WHERE id = :id');
                    $upd->execute([':p' => $newHash, ':id' => $row['id']]);
                } else {
                    $upd = $pdo->prepare('UPDATE users SET password = :p WHERE id = :id');
                    $upd->execute([':p' => $newHash, ':id' => $row['id']]);
                }
            } catch (Exception $e) {
                // Non-fatal: continue with authentication even if rehash failed
            }
        }
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
