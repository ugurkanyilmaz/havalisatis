<?php
/**
 * Rate Limiter Middleware
 * Prevents API abuse
 */

class RateLimiter {
    private Cache $cache;
    private array $config;
    
    public function __construct() {
        $this->cache = new Cache();
        $appConfig = require __DIR__ . '/../config/app.php';
        $this->config = $appConfig['rate_limit'];
    }
    
    public function check(): void {
        if (!$this->config['enabled']) {
            return;
        }
        
        $ip = $this->getClientIp();
        // Whitelist check
        if (!empty($this->config['whitelist_ips']) && in_array($ip, $this->config['whitelist_ips'], true)) {
            // Still expose headers with virtually unlimited values for visibility
            header('X-RateLimit-Bypass: whitelist');
            header('X-RateLimit-Limit: unlimited');
            header('X-RateLimit-Remaining: unlimited');
            return;
        }

        // Optional bypass key via header
        $bypassKey = $this->config['bypass_key'] ?? '';
        if ($bypassKey && isset($_SERVER['HTTP_X_BYPASS_KEY']) && hash_equals($bypassKey, $_SERVER['HTTP_X_BYPASS_KEY'])) {
            header('X-RateLimit-Bypass: key');
            header('X-RateLimit-Limit: unlimited');
            header('X-RateLimit-Remaining: unlimited');
            return;
        }
        $key = 'rate_limit_' . md5($ip . '_' . date('YmdHi'));
        
        $count = (int)$this->cache->get($key) ?: 0;
        
        // Check if banned
        $banKey = 'rate_limit_ban_' . md5($ip);
        if ($this->cache->has($banKey)) {
            Response::tooManyRequests('You have been temporarily banned. Please try again later.', $this->config['ban_duration']);
        }
        
        if ($count >= $this->config['max_requests']) {
            // Ban the IP
            $this->cache->set($banKey, true, $this->config['ban_duration']);
            Response::tooManyRequests('Rate limit exceeded. Too many requests.', $this->config['ban_duration']);
        }
        
        // Increment counter
        $this->cache->set($key, $count + 1, 60);
        
        // Add rate limit headers
        header('X-RateLimit-Limit: ' . $this->config['max_requests']);
        header('X-RateLimit-Remaining: ' . ($this->config['max_requests'] - $count - 1));
    }
    
    private function getClientIp(): string {
        // Check for CloudFlare
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        
        // Check for proxy
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($ips[0]);
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
