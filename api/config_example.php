<?php
// Local development: use SQLite to avoid needing MySQL on the dev machine.
// Keep original MySQL settings below for reference (uncomment if deploying to MySQL).
return [
    // Use MySQL in production / remote environment. Update credentials as needed.
    'driver' => 'sqlite',
    // 'host' => 'your_mysql_host',
    // 'port' => port_number,
    // 'database' => 'your_database_name',
    // 'username' => 'your_username',
    // 'password' => 'your_password',
    // 'charset' => 'utf8mb4',
    // Local dev fallback (SQLite) kept for convenience. Uncomment and adjust if needed.
    // 'driver' => 'sqlite',
    // 'sqlite_path' => __DIR__ . '/products.db',
];
