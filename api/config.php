<?php
// Local development: use SQLite to avoid needing MySQL on the dev machine.
// Keep original MySQL settings below for reference (uncomment if deploying to MySQL).
return [
    'driver' => 'sqlite',
    'sqlite_path' => __DIR__ . '/products.db',
    // 'mysql' => [
    //     'driver' => 'mysql',
    //     'host' => '94.73.148.122',
    //     'port' => 3306,
    //     'database' => 'u2415836_satis',
    //     'username' => 'u2415836_keten',
    //     'password' => 'G7!r9v@Qx2#LhP1w',
    //     'charset' => 'utf8mb4',
    // ],
];
