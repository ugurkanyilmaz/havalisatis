<?php
require_once __DIR__ . '/db.php';

$db = get_db();
$pdo = $db->getPdo();
$driver = method_exists($db, 'getDriver') ? $db->getDriver() : 'sqlite';

if ($driver === 'mysql') {
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_category VARCHAR(255),
    child_category VARCHAR(255),
    sku VARCHAR(128) UNIQUE,
    title TEXT,
    tags TEXT,
    discount DECIMAL(8,2),
    list_price DECIMAL(10,2),
    star_rating DECIMAL(3,2),
    product_description TEXT,
    feature1 VARCHAR(255),
    feature2 VARCHAR(255),
    feature3 VARCHAR(255),
    feature4 VARCHAR(255),
    feature5 VARCHAR(255),
    feature6 VARCHAR(255),
    feature7 VARCHAR(255),
    feature8 VARCHAR(255),
    brand VARCHAR(255),
    main_img TEXT,
    img1 TEXT,
    img2 TEXT,
    img3 TEXT,
    img4 TEXT,
    meta_title TEXT,
    meta_description TEXT,
    schema_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL;
} else {
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_category TEXT,
    child_category TEXT,
    sku TEXT UNIQUE,
    title TEXT,
    tags TEXT,
    discount REAL,
    list_price REAL,
    star_rating REAL,
    product_description TEXT,
    feature1 TEXT,
    feature2 TEXT,
    feature3 TEXT,
    feature4 TEXT,
    feature5 TEXT,
    feature6 TEXT,
    feature7 TEXT,
    feature8 TEXT,
    brand TEXT,
    main_img TEXT,
    img1 TEXT,
    img2 TEXT,
    img3 TEXT,
    img4 TEXT,
    meta_title TEXT,
    meta_description TEXT,
    schema_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SQL;
}

try {
    $db->exec($sql);
    // Report location of sqlite db if available
    $dbPath = realpath(__DIR__ . '/products.db') ?: (isset($config['sqlite_path']) ? $config['sqlite_path'] : null);
    echo "Database initialized" . ($dbPath ? " at: " . $dbPath : "") . PHP_EOL;
} catch (Exception $e) {
    echo "Error creating DB: " . $e->getMessage() . PHP_EOL;
}

// Create users table and ensure an admin user exists
try {
    if ($driver === 'mysql') {
        $u_sql = <<<SQL
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SQL;
    } else {
        $u_sql = <<<SQL
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT,
    password TEXT,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SQL;
    }
    $db->exec($u_sql);

    // Insert or update admin user. Use password_hash for secure storage.
    $adminUser = 'admin';
    $adminEmail = 'admin@gmail.com';
    $adminPassPlain = 'admin@123';
    // check existence by username
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = :u LIMIT 1');
    $stmt->execute([':u' => $adminUser]);
    $exists = $stmt->fetchColumn();
    $hash = password_hash($adminPassPlain, PASSWORD_DEFAULT);
    if (!$exists) {
        // try to update row with id=1 if present (convert existing first user to admin)
        try {
            $upById = $pdo->prepare('UPDATE users SET username = :u, email = :e, password = :p, role = :r WHERE id = 1');
            $upById->execute([':u'=>$adminUser, ':e'=>$adminEmail, ':p'=>$hash, ':r'=>'admin']);
            if ($upById->rowCount() > 0) {
                echo "Updated user id=1 to admin (username=admin)" . PHP_EOL;
            } else {
                $ins = $pdo->prepare('INSERT INTO users (username, email, password, role) VALUES (:u, :e, :p, :r)');
                $ins->execute([':u' => $adminUser, ':e' => $adminEmail, ':p' => $hash, ':r' => 'admin']);
                echo "Admin user created (username=admin, password=admin@123)" . PHP_EOL;
            }
        } catch (Exception $e) {
            // fallback to simple insert
            $ins = $pdo->prepare('INSERT INTO users (username, email, password, role) VALUES (:u, :e, :p, :r)');
            $ins->execute([':u' => $adminUser, ':e' => $adminEmail, ':p' => $hash, ':r' => 'admin']);
            echo "Admin user created (username=admin, password=admin@123)" . PHP_EOL;
        }
    } else {
        // update existing admin row to ensure email/role/password are current
        $up = $pdo->prepare('UPDATE users SET email = :e, password = :p, role = :r WHERE username = :u');
        $up->execute([':e' => $adminEmail, ':p' => $hash, ':r' => 'admin', ':u' => $adminUser]);
        echo "Admin user updated (username=admin)" . PHP_EOL;
    }
} catch (Exception $e) {
    echo "Error creating users table or admin user: " . $e->getMessage() . PHP_EOL;
}
