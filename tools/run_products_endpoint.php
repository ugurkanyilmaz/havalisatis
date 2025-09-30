<?php
// Run the actual products.php endpoint logic with custom GET params and capture output
$_GET['parent'] = 'Havalı El Aletleri';
$_GET['child'] = 'Havalı Kılavuz Çekme';
$_GET['page'] = '1';
$_GET['per_page'] = '10';

// include the endpoint (it will echo JSON)
require_once __DIR__ . '/../api/products.php';
