<?php
declare(strict_types=1);

// ** Gelişmiş DB Warmup Scripti **
// Hem CLI (Cron) hem de HTTP (cURL/WGET) ile tetiklenmeye uygundur.
// Karşılaşılan "Undefined constant PDO" hatasına karşı güvenlik kontrolü içerir.
// Kontrol: DB_WARMUP=1 (Çevre değişkeni veya URL parametresi olarak).

$isCli = PHP_SAPI === 'cli';
if (!$isCli) {
    header('Content-Type: text/plain; charset=utf-8');
}
@set_time_limit(20);

function ts(): string { return '[' . date('c') . '] '; }

function log_out(string $msg): void {
    $line = ts() . $msg . "\n";
    echo $line;
    // Loglama ayarı: DB_WARMUP_LOG çevre değişkeniyle bir dosya yolu belirtilirse loglar.
    $log = getenv('DB_WARMUP_LOG');
    if ($log) {
        // En iyi çaba ile ekleme; hataları görmezden gel.
        @file_put_contents($log, $line, FILE_APPEND);
    }
}

// 1. Config dosya yolu çözümleniyor
$configFile = getenv('DB_CONFIG_FILE');
if (!$configFile) {
    // 1a. Bu script'e göre göreceli yolu dene (../../config/database.php)
    $candidate = __DIR__ . '/../config/database.php';
    if (is_file($candidate)) {
        $configFile = realpath($candidate) ?: $candidate;
    }
}
if (!$configFile) {
    // 1b. Tipik cPanel/Hosting yolu deneniyor (HOME/public_html/api/v2/config/database.php)
    $home = getenv('HOME');
    if ($home) {
        $candidate = rtrim($home, '/\\') . '/public_html/api/v2/config/database.php';
        if (is_file($candidate)) {
            $configFile = $candidate;
        }
    }
}

if (!$configFile || !is_file($configFile)) {
    log_out('ERROR config not found. Provide DB_CONFIG_FILE env or ensure config path is correct.');
    http_response_code(500);
    exit(2);
}

// 2. Config yükleniyor
try {
    /** @var array $config */
    $config = require $configFile;
    log_out('INFO Config loaded from: ' . $configFile);
} catch (\Throwable $e) {
    log_out('ERROR loading config: ' . $e->getMessage());
    http_response_code(500);
    exit(2);
}

// 3. Warmup etkin mi kontrol ediliyor
if (!$isCli) {
    // HTTP mode: URL'de ?DB_WARMUP=1 olmalı
    $enabled = isset($_GET['DB_WARMUP']) && $_GET['DB_WARMUP'] === '1';
} else {
    // CLI mode: env var kontrolü
    $env = getenv('DB_WARMUP');
    $enabled = $env !== false ? filter_var($env, FILTER_VALIDATE_BOOLEAN) : ($config['warmup']['enabled'] ?? false);
}

if (!$enabled) {
    log_out('SKIP Warmup is disabled. Add ?DB_WARMUP=1 to URL or set DB_WARMUP=1 env var.');
    exit(0);
}

// 4. HTTP token koruması (isteğe bağlı)
if (!$isCli) {
    $expected = getenv('DB_WARMUP_TOKEN') ?: '';
    if ($expected !== '') {
        $got = isset($_GET['token']) ? (string)$_GET['token'] : '';
        if (!hash_equals($expected, $got)) {
            http_response_code(403);
            log_out('FORBIDDEN invalid token');
            exit(1);
        }
    }
}

// 5. DSN (Veritabanı bağlantı dizesi) oluşturuluyor
$driver = $config['driver'] ?? 'mysql';
if ($driver !== 'mysql') {
    log_out('SKIP unsupported driver: ' . $driver);
    exit(0);
}

$options = $config['options'] ?? [];
$charset = $config['charset'] ?? 'utf8mb4';

$dsnParts = [];
$host_set = false;

// Önceki hatayı çözmek için PDO::MYSQL_ATTR_UNIX_SOCKET sabitinin TANIMLI olup olmadığını KONTROL ET!
if (defined('PDO::MYSQL_ATTR_UNIX_SOCKET') && isset($options[PDO::MYSQL_ATTR_UNIX_SOCKET])) {
    $dsnParts[] = 'unix_socket=' . $options[PDO::MYSQL_ATTR_UNIX_SOCKET];
    $dsnParts[] = 'host=localhost';
    $host_set = true;
    log_out('INFO Using Unix Socket connection.');
}

if (!$host_set) {
    // Normal Host/Port bağlantısı
    $dsnParts[] = 'host=' . ($config['host'] ?? '127.0.0.1');
    if (!empty($config['port'])) {
        $dsnParts[] = 'port=' . (int)$config['port'];
    }
    log_out('INFO Using standard Host/Port connection.');
}

$dsnParts[] = 'dbname=' . ($config['database'] ?? '');
$dsnParts[] = 'charset=' . $charset;
$dsn = 'mysql:' . implode(';', $dsnParts);

// 6. Veritabanı sorgusu
$query = getenv('DB_WARMUP_QUERY') ?: ($config['warmup']['query'] ?? 'SELECT 1');
log_out('INFO Starting warmup query: ' . $query);

$start = microtime(true);
try {
    $pdo = new PDO($dsn, $config['username'] ?? null, $config['password'] ?? null, $options);
    $stmt = $pdo->query($query);
    if ($stmt !== false) {
        $stmt->fetch();
    }
    $ms = (int) round((microtime(true) - $start) * 1000);
    log_out('OK Warmup successful in ' . $ms . 'ms');
    exit(0);
} catch (\Throwable $e) {
    $ms = (int) round((microtime(true) - $start) * 1000);
    http_response_code(500);
    log_out('FATAL Warmup failed in ' . $ms . 'ms. Error: ' . $e->getMessage());
    exit(1);
}