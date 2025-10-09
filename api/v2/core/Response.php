<?php
/**
 * HTTP Response Handler
 * Consistent API responses
 */

class Response {
    public static function json($data, int $statusCode = 200, array $headers = []): void {
        http_response_code($statusCode);
        
        header('Content-Type: application/json; charset=utf-8');
        foreach ($headers as $key => $value) {
            header("$key: $value");
        }
        
        // Enable GZIP if not already started
        if (!ob_get_level()) {
            if (!ob_start('ob_gzhandler')) {
                ob_start();
            }
        }
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    public static function success($data = null, string $message = null, array $meta = []): void {
        $response = ['success' => true];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        if (!empty($meta)) {
            $response['meta'] = $meta;
        }
        
        self::json($response);
    }
    
    public static function error(string $message, int $statusCode = 400, array $details = []): void {
        $response = [
            'success' => false,
            'error' => $message,
        ];
        
        if (!empty($details)) {
            $response['details'] = $details;
        }
        
        self::json($response, $statusCode);
    }
    
    public static function notFound(string $message = 'Resource not found'): void {
        self::error($message, 404);
    }
    
    public static function unauthorized(string $message = 'Unauthorized'): void {
        self::error($message, 401);
    }
    
    public static function forbidden(string $message = 'Forbidden'): void {
        self::error($message, 403);
    }
    
    public static function badRequest(string $message = 'Bad request'): void {
        self::error($message, 400);
    }
    
    public static function serverError(string $message = 'Internal server error'): void {
        self::error($message, 500);
    }
    
    public static function tooManyRequests(string $message = 'Too many requests', int $retryAfter = 60): void {
        self::json([
            'success' => false,
            'error' => $message,
            'retry_after' => $retryAfter,
        ], 429, ['Retry-After' => $retryAfter]);
    }
}
