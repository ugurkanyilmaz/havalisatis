<?php
/**
 * Categories Endpoint
 * GET /api/v2/categories.php
 * 
 * Returns distinct parent/child category pairs with custom ordering
 */

require_once __DIR__ . '/bootstrap.php';

try {
    // Apply rate limiting
    $rateLimiter = new RateLimiter();
    $rateLimiter->check();
    
    // Get categories
    $controller = new CategoriesController();
    $controller->index();
    
} catch (Exception $e) {
    error_log('Categories API Error: ' . $e->getMessage());
    Response::error('Service temporarily unavailable', 503, ['Retry-After' => 5]);
}
