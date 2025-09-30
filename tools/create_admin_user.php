<?php
// Usage: php create_admin_user.php username password [email]
// Example: php create_admin_user.php keten 'keten@4145' 'admin@example.com'

if ($argc < 3) {
    echo "Usage: php create_admin_user.php <username> <password> [email]\n";
    exit(1);
}

$username = $argv[1];
$password = $argv[2];
$email = $argv[3] ?? null;

$configPath = __DIR__ . '/../php/config.php';
if (!file_exists($configPath)) {
    echo "Error: php/config.php not found. Upload config.php to php/ directory first.\n";
    exit(1);
}

$config = include $configPath;
try {
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
    $pdo = new PDO($dsn, $config['username'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    echo "Connection error: " . $e->getMessage() . "\n";
    exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT);

// If user exists, update password and role to admin. Otherwise insert.
try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username');
    $stmt->execute([':username' => $username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $stmt = $pdo->prepare('UPDATE users SET password = :password, role = :role, email = :email WHERE username = :username');
        $stmt->execute([':password' => $hash, ':role' => 'admin', ':email' => $email, ':username' => $username]);
        echo "Updated existing user '$username' as admin.\n";
    } else {
        $stmt = $pdo->prepare('INSERT INTO users (username, email, password, role) VALUES (:username, :email, :password, :role)');
        $stmt->execute([':username' => $username, ':email' => $email, ':password' => $hash, ':role' => 'admin']);
        echo "Inserted new admin user '$username'.\n";
    }
} catch (PDOException $e) {
    echo "DB error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "Done. You can now log in as '$username'.\n";
