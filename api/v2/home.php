<?php
/**
 * API v2 - Home Endpoint
 * Returns popular and special priced products from static cache
 * 
 * GET /api/v2/home.php
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $rateLimiter = new RateLimiter();
    $rateLimiter->check();
    
    $controller = new HomeController();
    $controller->index();
    
} catch (Exception $e) {
    error_log('[API v2] Home error: ' . $e->getMessage());
    Response::serverError($e->getMessage());
}
