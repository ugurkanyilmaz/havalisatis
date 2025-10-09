<?php
/**
 * Modern Database Connection Manager
 * Singleton pattern with connection pooling
 */

class Database {
    private static ?Database $instance = null;
    private ?PDO $connection = null;
    private array $config;
    
    private function __construct() {
        $this->config = require __DIR__ . '/../config/database.php';
    }
    
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection(): PDO {
        if ($this->connection === null) {
            $this->connect();
        }
        
        // Ping connection to ensure it's alive (especially for persistent connections on shared hosting)
        try {
            // Use getAttribute instead of query - safer for checking connection health
            // This doesn't create a new statement/result set
            $this->connection->getAttribute(PDO::ATTR_SERVER_INFO);
        } catch (PDOException $e) {
            // Connection is dead (MySQL gone away, etc.) - force reconnect
            error_log('[DB] Connection lost, reconnecting: ' . $e->getMessage());
            $this->connection = null;
            $this->connect();
        }
        
        return $this->connection;
    }
    
    // Alias for backwards compatibility
    public function getPdo(): PDO {
        return $this->getConnection();
    }
    
    private function connect(): void {
        $config = $this->config;
        $maxRetries = 3;
        $retryDelay = 100000; // 100ms in microseconds
        $lastException = null;
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                // Build DSN for MySQL
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $config['host'],
                    $config['port'],
                    $config['database'],
                    $config['charset']
                );
                $this->connection = new PDO(
                    $dsn,
                    $config['username'],
                    $config['password'],
                    $config['options']
                );
                
                // Success - test with a real query to ensure connection is usable
                $this->connection->query('SELECT 1');
                
                if ($attempt > 1) {
                    error_log('[DB] Connected successfully on attempt ' . $attempt);
                }
                return;
                
            } catch (PDOException $e) {
                $lastException = $e;
                error_log('[DB] Connection attempt ' . $attempt . ' failed: ' . $e->getMessage());
                
                if ($attempt < $maxRetries) {
                    usleep($retryDelay * $attempt); // Exponential backoff
                }
            }
        }
        
        // All retries exhausted
        error_log('[DB] Connection failed after ' . $maxRetries . ' attempts: ' . $lastException->getMessage());
        throw new Exception('Database connection failed after multiple retries', 503);
    }
    
    public function query(string $sql, array $params = []): PDOStatement {
        $stmt = $this->getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetchAll(string $sql, array $params = []): array {
        return $this->query($sql, $params)->fetchAll();
    }
    
    public function fetchOne(string $sql, array $params = []): ?array {
        $result = $this->query($sql, $params)->fetch();
        return $result ?: null;
    }
    
    public function fetchColumn(string $sql, array $params = []) {
        return $this->query($sql, $params)->fetchColumn();
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
