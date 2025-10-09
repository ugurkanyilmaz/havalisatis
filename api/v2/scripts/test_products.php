<?php
/**
 * Test products API directly
 */

require_once __DIR__ . '/../bootstrap.php';

try {
    echo "Testing ProductsController...\n\n";
    
    $controller = new ProductsController();
    
    // Simulate GET request
    $_GET['per_page'] = 10;
    $_GET['page'] = 1;
    
    // This will output JSON and exit, so we need to capture it
    ob_start();
    $controller->index();
    $output = ob_get_clean();
    
    echo "Output:\n";
    echo $output . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
