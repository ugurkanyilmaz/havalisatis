<?php
/**
 * Quick diagnostic script
 * Upload to: public_html/diagnostic.php
 * Access: https://havalielaletlerisatis.com/diagnostic.php
 */

header('Content-Type: text/plain; charset=utf-8');
echo "=== DIAGNOSTIC REPORT ===\n\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n\n";

// 1. PHP Version & Settings
echo "--- PHP INFO ---\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Memory Limit: " . ini_get('memory_limit') . "\n";
echo "Max Execution Time: " . ini_get('max_execution_time') . "\n";
echo "Max Input Time: " . ini_get('max_input_time') . "\n";
echo "Post Max Size: " . ini_get('post_max_size') . "\n";
echo "Upload Max: " . ini_get('upload_max_filesize') . "\n";
echo "\n";

// 2. File System
echo "--- FILE SYSTEM ---\n";
echo "Current Dir: " . __DIR__ . "\n";
echo "Writable: " . (is_writable(__DIR__) ? 'YES' : 'NO') . "\n";

// Check important directories
$dirs = ['api', 'api/cache', 'api/cron', 'api/logs', 'assets'];
foreach ($dirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    $exists = is_dir($path);
    $writable = $exists && is_writable($path);
    echo "$dir: " . ($exists ? 'EXISTS' : 'MISSING') . ($writable ? ' (writable)' : ' (not writable)') . "\n";
}
echo "\n";

// 3. Database Connection
echo "--- DATABASE ---\n";
try {
    if (file_exists(__DIR__ . '/api/config.php')) {
        $config = include __DIR__ . '/api/config.php';
        
        if ($config['driver'] === 'mysql') {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']}";
            $pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_TIMEOUT => 5,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            
            $stmt = $pdo->query('SELECT COUNT(*) as count FROM products');
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "MySQL Connection: OK\n";
            echo "Products Count: " . $result['count'] . "\n";
            
            // Check connection variables
            $stmt = $pdo->query("SHOW VARIABLES LIKE 'max_connections'");
            $maxConn = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "Max Connections: " . $maxConn['Value'] . "\n";
            
            $stmt = $pdo->query("SHOW STATUS LIKE 'Threads_connected'");
            $threadsConn = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "Current Connections: " . $threadsConn['Value'] . "\n";
        } else {
            echo "Using SQLite\n";
        }
    } else {
        echo "Config file not found\n";
    }
} catch (Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
echo "\n";

// 4. Cache Status
echo "--- CACHE ---\n";
if (is_dir(__DIR__ . '/api/cache')) {
    $cacheFiles = glob(__DIR__ . '/api/cache/*.{cache,json}', GLOB_BRACE);
    echo "Cache files: " . count($cacheFiles) . "\n";
    
    $totalSize = 0;
    foreach ($cacheFiles as $file) {
        $totalSize += filesize($file);
    }
    echo "Total cache size: " . round($totalSize / 1024, 2) . " KB\n";
} else {
    echo "Cache directory not found\n";
}
echo "\n";

// 5. Resource Usage
echo "--- RESOURCES ---\n";
echo "Memory Usage: " . round(memory_get_usage(true) / 1024 / 1024, 2) . " MB\n";
echo "Peak Memory: " . round(memory_get_peak_usage(true) / 1024 / 1024, 2) . " MB\n";
echo "\n";

// 6. Extensions
echo "--- EXTENSIONS ---\n";
$required = ['pdo', 'pdo_mysql', 'curl', 'json', 'mbstring'];
foreach ($required as $ext) {
    echo "$ext: " . (extension_loaded($ext) ? 'LOADED' : 'MISSING') . "\n";
}
echo "\n";

// 7. Test API endpoint
echo "--- API TEST ---\n";
try {
    $ch = curl_init('http://localhost/api/health.php');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    echo "Health Check: " . ($httpCode === 200 ? 'OK' : "ERROR ($httpCode)") . "\n";
    if ($error) echo "CURL Error: $error\n";
} catch (Exception $e) {
    echo "API Test Error: " . $e->getMessage() . "\n";
}
echo "\n";

echo "=== END DIAGNOSTIC ===\n";
