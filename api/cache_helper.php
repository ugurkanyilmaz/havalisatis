<?php
// Simple file-based cache helper for API responses
class SimpleCache {
    private $cacheDir;
    private $defaultTtl;

    public function __construct($cacheDir = null, $defaultTtl = 300) {
        $this->cacheDir = $cacheDir ?: __DIR__ . '/cache';
        $this->defaultTtl = $defaultTtl; // 5 minutes default
        
        // Create cache directory if it doesn't exist
        if (!is_dir($this->cacheDir)) {
            @mkdir($this->cacheDir, 0755, true);
        }
    }

    private function getCacheKey($key) {
        return md5($key);
    }

    private function getCacheFile($key) {
        return $this->cacheDir . '/' . $this->getCacheKey($key) . '.cache';
    }

    public function get($key) {
        $file = $this->getCacheFile($key);
        
        if (!file_exists($file)) {
            return null;
        }

        $data = @file_get_contents($file);
        if ($data === false) {
            return null;
        }

        $cached = @json_decode($data, true);
        if (!$cached || !isset($cached['expires']) || !isset($cached['data'])) {
            return null;
        }

        // Check if expired
        if (time() > $cached['expires']) {
            @unlink($file);
            return null;
        }

        return $cached['data'];
    }

    public function set($key, $data, $ttl = null) {
        $ttl = $ttl ?: $this->defaultTtl;
        $file = $this->getCacheFile($key);
        
        $cached = [
            'expires' => time() + $ttl,
            'data' => $data
        ];

        $result = @file_put_contents($file, json_encode($cached, JSON_UNESCAPED_UNICODE));
        return $result !== false;
    }

    public function delete($key) {
        $file = $this->getCacheFile($key);
        if (file_exists($file)) {
            return @unlink($file);
        }
        return true;
    }

    public function clear() {
        // ONLY clear our .cache files, NOT existing home.json or other files
        $files = glob($this->cacheDir . '/*.cache');
        $cleared = 0;
        foreach ($files as $file) {
            if (@unlink($file)) {
                $cleared++;
            }
        }
        return $cleared;
    }

    // Generate cache key from request parameters
    public static function generateCacheKey($params = []) {
        // Include common request parameters
        $cacheParams = [
            'parent' => $_GET['parent'] ?? null,
            'child' => $_GET['child'] ?? null,
            'q' => $_GET['q'] ?? null,
            'page' => $_GET['page'] ?? 1,
            'per_page' => $_GET['per_page'] ?? 20
        ];
        
        // Override with custom params if provided
        $cacheParams = array_merge($cacheParams, $params);
        
        // Remove null values and sort for consistent keys
        $cacheParams = array_filter($cacheParams, function($v) { return $v !== null; });
        ksort($cacheParams);
        
        return 'products_' . http_build_query($cacheParams);
    }
}

// Helper function to get cache instance
function get_cache() {
    static $cache = null;
    if ($cache === null) {
        $cache = new SimpleCache();
    }
    return $cache;
}