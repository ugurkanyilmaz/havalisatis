<?php
/**
 * Modern Cache Manager
 * File-based caching with atomic writes
 */

class Cache {
    private string $cacheDir;
    private int $defaultTtl;
    
    public function __construct(string $cacheDir = null, int $defaultTtl = 300) {
        $this->cacheDir = $cacheDir ?? __DIR__ . '/../cache';
        $this->defaultTtl = $defaultTtl;
        
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    public function get(string $key) {
        $file = $this->getCacheFile($key);
        
        if (!file_exists($file)) {
            return null;
        }
        
        $data = @file_get_contents($file);
        if ($data === false) {
            return null;
        }
        
        $cached = @json_decode($data, true);
        if (!$cached || !isset($cached['expires'], $cached['data'])) {
            return null;
        }
        
        // Check expiration
        if (time() > $cached['expires']) {
            @unlink($file);
            return null;
        }
        
        return $cached['data'];
    }
    
    public function set(string $key, $data, int $ttl = null): bool {
        $ttl = $ttl ?? $this->defaultTtl;
        $file = $this->getCacheFile($key);
        
        $cached = [
            'expires' => time() + $ttl,
            'data' => $data,
            'created_at' => time(),
        ];
        
        // Atomic write
        $tmpFile = $file . '.' . uniqid('tmp', true);
        $result = @file_put_contents($tmpFile, json_encode($cached, JSON_UNESCAPED_UNICODE));
        
        if ($result !== false) {
            return @rename($tmpFile, $file);
        }
        
        @unlink($tmpFile);
        return false;
    }
    
    public function delete(string $key): bool {
        $file = $this->getCacheFile($key);
        if (file_exists($file)) {
            return @unlink($file);
        }
        return true;
    }
    
    public function clear(): int {
        $files = glob($this->cacheDir . '/*.cache');
        $cleared = 0;
        
        foreach ($files as $file) {
            if (@unlink($file)) {
                $cleared++;
            }
        }
        
        return $cleared;
    }
    
    public function has(string $key): bool {
        return $this->get($key) !== null;
    }
    
    private function getCacheFile(string $key): string {
        return $this->cacheDir . '/' . md5($key) . '.cache';
    }
    
    public static function key(...$parts): string {
        return implode('_', array_map(function($part) {
            return is_array($part) ? md5(json_encode($part)) : $part;
        }, $parts));
    }
}
