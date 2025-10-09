<?php
/**
 * Home Controller
 * Serves static cached home data (popular + special prices)
 * This eliminates 2 SQL queries on every page load!
 */

class HomeController {
    private string $cacheFile;
    
    public function __construct() {
        $config = require __DIR__ . '/../config/app.php';
        $this->cacheFile = $config['static_cache']['home'];
    }
    
    public function index(): void {
        // Set cache headers
        header('Cache-Control: public, max-age=300');
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');
        
        // Check if static cache exists
        if (!file_exists($this->cacheFile)) {
            // Generate it for the first time
            $this->regenerate();
            return;
        }
        
        // Check if cache is fresh (less than 1 hour old)
        $cacheAge = time() - filemtime($this->cacheFile);
        if ($cacheAge > 3600) {
            header('X-Cache-Status: stale');
        } else {
            header('X-Cache-Status: fresh');
        }
        
        // Serve from static file
        $data = file_get_contents($this->cacheFile);
        if ($data === false) {
            Response::serverError('Failed to read cache');
        }
        
        header('Content-Type: application/json; charset=utf-8');
        echo $data;
        exit;
    }
    
    public function regenerate(): void {
        try {
            $db = Database::getInstance();
            
            // Build safe token match for comma/semicolon separated tags, spaces tolerated
            // Works on both MySQL and SQLite (no REGEXP dependency)
            $tokenMatch = function(string $token): array {
                // exact token or surrounded by , or ; (spaces removed via REPLACE)
                $t = $token;
                return [
                    $t,            // exact
                    $t . ',%',     // at start, comma next
                    '%,'. $t,      // at end, comma before
                    '%,'. $t . ',%', // middle, commas around
                    $t . ';%',     // at start, semicolon next
                    '%;'. $t,      // at end, semicolon before
                    '%;'. $t . ';%', // middle, semicolons around
                ];
            };

            // Popular
            $popularSql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category
                            FROM products
                            WHERE (
                                REPLACE(COALESCE(tags,''), ' ', '') = ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                                OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                            )
                            ORDER BY id DESC
                            LIMIT 12";
            $popular = $db->fetchAll($popularSql, $tokenMatch('popular'));

            // Special prices (exact token 'special_price')
            $specialSql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category
                           FROM products
                           WHERE (
                               REPLACE(COALESCE(tags,''), ' ', '') = ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                               OR REPLACE(COALESCE(tags,''), ' ', '') LIKE ?
                           )
                           ORDER BY id DESC
                           LIMIT 12";
            $specialPrices = $db->fetchAll($specialSql, $tokenMatch('special_price'));
            
            $data = [
                'popular' => $popular,
                'specialPrices' => $specialPrices,
                'generated_at' => date('c'),
            ];
            
            // Write atomically
            $tmpFile = $this->cacheFile . '.' . uniqid('tmp', true);
            $result = file_put_contents($tmpFile, json_encode($data, JSON_UNESCAPED_UNICODE));
            
            if ($result === false) {
                @unlink($tmpFile);
                Response::serverError('Failed to write cache');
            }
            
            if (!@rename($tmpFile, $this->cacheFile)) {
                @unlink($tmpFile);
                Response::serverError('Failed to update cache');
            }
            
            Response::success($data, 'Home cache regenerated successfully');
            
        } catch (Exception $e) {
            error_log('[HomeController] Error: ' . $e->getMessage());
            Response::serverError('Failed to regenerate cache');
        }
    }
}
