<?php
/**
 * Simple uploader file server for the admin-uploaded files.
 * Usage: /api/v2/uploads/{filename}
 * This script resolves the filename from the path and serves the file if exists.
 */

// Disable directory listing and require valid filename
$path = $_SERVER['REQUEST_URI'] ?? '';
// Expect path like /api/v2/uploads/filename.ext
$parts = explode('/', $path);
$filename = end($parts);
if (!$filename || strpos($filename, '..') !== false) {
    http_response_code(400);
    echo 'Bad request';
    exit;
}

$file = __DIR__ . '/' . $filename;
if (!file_exists($file) || !is_file($file)) {
    http_response_code(404);
    echo 'Not found';
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file);
finfo_close($finfo);

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($file));
// Cache for a while
header('Cache-Control: public, max-age=86400');
readfile($file);
exit;
