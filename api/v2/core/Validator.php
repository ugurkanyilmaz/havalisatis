<?php
/**
 * Input Validator & Sanitizer
 */

class Validator {
    public static function string(string $value, int $maxLength = 255): string {
        $value = trim($value);
        $value = strip_tags($value);
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        
        if (strlen($value) > $maxLength) {
            $value = mb_substr($value, 0, $maxLength, 'UTF-8');
        }
        
        return $value;
    }
    
    public static function alphaNumericSpace(string $value, int $maxLength = 60): string {
        $value = self::string($value, $maxLength);
        // Allow letters, numbers, spaces, Turkish characters, hyphens
        $value = preg_replace('/[^a-zA-ZığüşöçİĞÜŞÖÇ0-9\s\-]/u', '', $value);
        return trim($value);
    }
    
    public static function int($value, int $min = 0, int $max = PHP_INT_MAX, int $default = 0): int {
        $value = filter_var($value, FILTER_VALIDATE_INT);
        if ($value === false) {
            return $default;
        }
        return max($min, min($max, $value));
    }
    
    public static function float($value, float $min = 0, float $max = PHP_FLOAT_MAX, float $default = 0): float {
        $value = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($value === false) {
            return $default;
        }
        return max($min, min($max, $value));
    }
    
    public static function sku(string $value): string {
        $value = trim($value);
        // SKU: alphanumeric + dash + underscore only
        $value = preg_replace('/[^a-zA-Z0-9\-_]/', '', $value);
        return substr($value, 0, 128);
    }
    
    public static function email(string $value): ?string {
        $email = filter_var($value, FILTER_VALIDATE_EMAIL);
        return $email ?: null;
    }
    
    public static function required($value, string $fieldName): void {
        if (empty($value)) {
            Response::badRequest("$fieldName is required");
        }
    }
}
