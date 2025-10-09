<?php
/**
 * Tags Endpoint
 * GET /api/v2/tags.php
 * 
 * Returns distinct tags with Turkish labels
 */

require_once __DIR__ . '/bootstrap.php';

try {
    // Apply rate limiting
    $rateLimiter = new RateLimiter();
    $rateLimiter->check();
    
    // Get tags
    $controller = new TagsController();
    $controller->index();
    
} catch (Exception $e) {
    error_log('Tags API Error: ' . $e->getMessage());
    Response::error('Service temporarily unavailable', 503, ['Retry-After' => 5]);
}
