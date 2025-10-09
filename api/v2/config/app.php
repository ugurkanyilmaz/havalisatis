<?php
/**
 * API Configuration
 */

return [
    // Cache settings
    'cache' => [
        'enabled' => true,
        'ttl' => 300, // 5 minutes
        'search_ttl' => 60, // 1 minute for search results
    ],
    
    // Rate limiting
    'rate_limit' => [
        'enabled' => true,
        // Relaxed defaults (can be tuned). Frontend dev may burst; keep generous.
        'max_requests' => 300, // per minute
        'ban_duration' => 60, // seconds
        // Optional IP whitelist to bypass rate limit (e.g., your office/home IPs)
        // Note: X-Forwarded-For / CF headers are honored in RateLimiter::getClientIp()
        'whitelist_ips' => [
            '127.0.0.1',
            '::1',
            // Add your public IP(s) below, e.g. '1.2.3.4'
        ],
        // Optional shared bypass key via header `X-Bypass-Key: <value>`
        // Useful for trusted internal services or CI. Leave empty to disable.
        'bypass_key' => getenv('API_BYPASS_KEY') ?: '',
    ],
    
    // Pagination
    'pagination' => [
        'default_per_page' => 24,
        'max_per_page' => 100,
    ],
    
    // Admin
    'admin' => [
        'session_lifetime' => 86400, // 24 hours
    ],
    
    // Static cache files
    'static_cache' => [
        'home' => __DIR__ . '/../cache/home.json',
        'categories' => __DIR__ . '/../cache/categories.json',
    ],
];
