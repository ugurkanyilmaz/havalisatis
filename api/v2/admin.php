<?php
/**
 * API v2 - Admin Endpoint
 * Admin operations
 * 
 * POST /api/v2/admin.php?action=login
 * POST /api/v2/admin.php?action=logout
 * GET  /api/v2/admin.php?action=check
 * POST /api/v2/admin.php?action=refresh_home (requires auth)
 * POST /api/v2/admin.php?action=clear_cache (requires auth)
 * POST /api/v2/admin.php?action=bulk_upload (requires auth)
 * POST /api/v2/admin.php?action=init (initialize users table with default admin)
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $controller = new AdminController();
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'login':
            $controller->login();
            break;
            
        case 'logout':
            $controller->logout();
            break;
            
        case 'check':
            $controller->check();
            break;
            
        case 'refresh_home':
            $controller->refreshHomeCache();
            break;
            
        case 'clear_cache':
            $controller->clearCache();
            break;
            
        case 'delete_tag':
            $controller->deleteTag();
            break;
            
        case 'delete_category':
            $controller->deleteCategory();
            break;
            
        case 'bulk_upload':
            $controller->bulkUpload();
            break;

        case 'export_products':
            $controller->exportProducts();
            break;

        case 'upload_image':
            $controller->uploadImage();
            break;

        case 'generate_feed':
            $controller->generateGoogleFeed();
            break;
            
        case 'init':
            $controller->init();
            break;
            
        default:
            Response::badRequest('Invalid action');
    }
    
} catch (Exception $e) {
    error_log('[API v2] Admin error: ' . $e->getMessage());
    Response::serverError($e->getMessage());
}
