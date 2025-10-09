<?php
/**
 * Authentication Middleware
 * Check admin session
 */

class Auth {
    public static function check(): bool {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return !empty($_SESSION['admin_user']);
    }
    
    public static function require(): void {
        if (!self::check()) {
            Response::unauthorized('Authentication required');
        }
    }
    
    public static function user(): ?array {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return $_SESSION['admin_user'] ?? null;
    }
    
    public static function login(array $user): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['admin_user'] = $user;
    }
    
    public static function logout(): void {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        unset($_SESSION['admin_user']);
        session_destroy();
    }
}
