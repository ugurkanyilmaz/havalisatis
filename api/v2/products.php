<?php
/**
 * API v2 - Products Endpoint
 * Modern products API with caching and filtering
 * 
 * GET  /api/v2/products.php?parent=X&child=Y&q=search&page=1&per_page=24
 * GET  /api/v2/products.php?sku=ABC123
 * GET  /api/v2/products.php?action=list[&sku=X] (admin - list all or get one)
 * POST /api/v2/products.php?action=update (admin - update/insert product)
 * POST /api/v2/products.php?action=delete (admin - delete product)
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $rateLimiter = new RateLimiter();
    $rateLimiter->check();
    
    $controller = new ProductsController();
    $action = $_GET['action'] ?? '';
    
    // Admin actions
    if ($action === 'list') {
        $controller->list();
    } elseif ($action === 'update') {
        $controller->update();
    } elseif ($action === 'delete') {
        $controller->delete();
    }
    // Public endpoints
    elseif (isset($_GET['sku'])) {
        $controller->show($_GET['sku']);
    } else {
        $controller->index();
    }
    
} catch (Exception $e) {
    error_log('[API v2] Products error: ' . $e->getMessage());
    
    if ($e->getCode() === 503) {
        Response::error('Service temporarily unavailable', 503);
    }
    
    Response::serverError($e->getMessage());
}
