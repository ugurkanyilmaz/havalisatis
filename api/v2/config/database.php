<?php
/**
 * Database configuration (MySQL only)
 *
 * This file intentionally contains only MySQL configuration. SQLite
 * support has been removed to simplify the production deployment.
 */

// Build PDO options safely (avoid undefined constants on some hosts)
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_TIMEOUT => 5,
];
if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
    // Build init commands with optional session timeouts to keep persistent connections alive longer
    $initCmds = ["SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"];
    $waitTimeout = getenv('DB_WAIT_TIMEOUT');
    $interactiveTimeout = getenv('DB_INTERACTIVE_TIMEOUT');
    if ($waitTimeout !== false && is_numeric($waitTimeout)) {
        $initCmds[] = "SET SESSION wait_timeout=" . (int)$waitTimeout;
    }
    if ($interactiveTimeout !== false && is_numeric($interactiveTimeout)) {
        $initCmds[] = "SET SESSION interactive_timeout=" . (int)$interactiveTimeout;
    }
    $options[PDO::MYSQL_ATTR_INIT_COMMAND] = implode('; ', $initCmds);
}

// Prefer persistent connections to reduce cold-start cost
$persistent = filter_var(getenv('DB_PERSISTENT') !== false ? getenv('DB_PERSISTENT') : '1', FILTER_VALIDATE_BOOLEAN);
$options[PDO::ATTR_PERSISTENT] = $persistent;

// Prefer Unix socket if provided (faster than TCP on the same host)
$socket = getenv('DB_SOCKET');
if ($socket && defined('PDO::MYSQL_ATTR_UNIX_SOCKET')) {
    $options[PDO::MYSQL_ATTR_UNIX_SOCKET] = $socket;
}

return [
    'driver' => 'mysql',
    // If DB_SOCKET is set, 'localhost' will use the socket; otherwise keep fast TCP with 127.0.0.1
    'host' => getenv('DB_HOST') ?: (getenv('DB_SOCKET') ? 'localhost' : '127.0.0.1'),
    'port' => (int)(getenv('DB_PORT') ?: 3306),
    'database' => getenv('DB_DATABASE') ?: 'u2415836_satis',
    'username' => getenv('DB_USERNAME') ?: 'u2415836_keten',
    'password' => getenv('DB_PASSWORD') ?: 'G7!r9v@Qx2#LhP1w',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'options' => $options,

    // Optional warm-up (no side effects by default). Use this from a cron/health-check to ping the DB.
    'warmup' => [
        'enabled' => filter_var(getenv('DB_WARMUP') !== false ? getenv('DB_WARMUP') : '0', FILTER_VALIDATE_BOOLEAN),
        'query' => getenv('DB_WARMUP_QUERY') ?: 'SELECT 1',
    ],
];
