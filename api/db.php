<?php
// DB helper supporting SQLite (default) and MySQL when configured via config.php
class DB {
    private $pdo;
    private $driver;

    public function __construct($config = null) {
        // try load config if not provided
        if ($config === null) {
            // Always use the primary config.php when available.
            if (file_exists(__DIR__ . '/config.php')) {
                $config = include __DIR__ . '/config.php';
            }
        }
        $this->connect($config);
    }

    private function connect($config = null) {
        if ($this->pdo) return;
        // If config specifies mysql, use it
        if (is_array($config) && !empty($config['driver']) && strtolower($config['driver']) === 'mysql') {
            $host = $config['host'] ?? '127.0.0.1';
            $port = $config['port'] ?? 3306;
            $db = $config['database'] ?? 'keten';
            $user = $config['username'] ?? 'root';
            $pass = $config['password'] ?? '';
            $charset = $config['charset'] ?? 'utf8mb4';
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";
            $this->pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $this->driver = 'mysql';
            return;
        }

        // fallback to SQLite
        $path = $config['sqlite_path'] ?? __DIR__ . '/products.db';
        $dir = dirname($path);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $this->pdo = new PDO('sqlite:' . $path);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->driver = 'sqlite';
        // Improve SQLite behavior for concurrent reads/writes on production
        // Set a busy timeout (milliseconds) so writes will wait briefly instead of failing
        try {
            // PDO::ATTR_TIMEOUT sets a busy timeout in seconds for SQLite driver
            if (defined('PDO::ATTR_TIMEOUT')) {
                $this->pdo->setAttribute(PDO::ATTR_TIMEOUT, 5); // seconds
            }
            // Also set PRAGMAs to enable WAL mode and increase resiliency
            $this->pdo->exec('PRAGMA journal_mode = WAL');
            $this->pdo->exec('PRAGMA synchronous = NORMAL');
            // busy_timeout in milliseconds
            $this->pdo->exec('PRAGMA busy_timeout = 5000');
        } catch (Throwable $e) {
            // ignore PRAGMA failures; don't break startup
        }
    }

    public function getPdo() {
        return $this->pdo;
    }

    public function getDriver() { return $this->driver; }

    public function exec($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}

function get_db($config = null) {
    static $db = null;
    if ($db === null) $db = new DB($config);
    return $db;
}
