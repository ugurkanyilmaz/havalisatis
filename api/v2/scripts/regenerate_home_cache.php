<?php
require_once __DIR__ . '/../bootstrap.php';

// Simple CLI helper to rebuild home cache without admin session
if (php_sapi_name() !== 'cli') {
    echo "Run from CLI: php api/v2/scripts/regenerate_home_cache.php\n";
    exit(1);
}

try {
    $controller = new HomeController();
    // Call regenerate(), which will also output a JSON response; we suppress output
    ob_start();
    $controller->regenerate();
    $out = ob_get_clean();
    echo "Home cache regenerated.\n";
} catch (Exception $e) {
    fwrite(STDERR, 'Error: ' . $e->getMessage() . "\n");
    exit(2);
}
