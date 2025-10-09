<?php
/**
 * API v2 Bootstrap
 * Loads all core classes and initializes the environment
 */

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Set timezone
date_default_timezone_set('Europe/Istanbul');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load core classes
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Cache.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Validator.php';

// Load middleware
require_once __DIR__ . '/middleware/RateLimiter.php';
require_once __DIR__ . '/middleware/Auth.php';

// Load controllers
require_once __DIR__ . '/controllers/HomeController.php';
require_once __DIR__ . '/controllers/ProductsController.php';
require_once __DIR__ . '/controllers/AdminController.php';
require_once __DIR__ . '/controllers/CategoriesController.php';
require_once __DIR__ . '/controllers/TagsController.php';

// Set JSON headers
header('Content-Type: application/json; charset=utf-8');

// CORS headers (if needed)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = [
        'https://havalielaletlerisatis.com',
        'http://localhost:5173',
    ];
    
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
}

// Handle OPTIONS request
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Global error handler
set_exception_handler(function($exception) {
    error_log('[API v2] Uncaught exception: ' . $exception->getMessage());
    error_log('[API v2] Stack trace: ' . $exception->getTraceAsString());
    
    // In development, show detailed error
    $isDev = ($_SERVER['REMOTE_ADDR'] ?? '') === '127.0.0.1' || 
             ($_SERVER['REMOTE_ADDR'] ?? '') === '::1' ||
             strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
    
    if ($isDev) {
        Response::error(
            $exception->getMessage(),
            500,
            [
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'trace' => explode("\n", $exception->getTraceAsString())
            ]
        );
    } else {
        Response::serverError('An unexpected error occurred');
    }
});
