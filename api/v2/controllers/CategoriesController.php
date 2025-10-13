<?php
/**
 * Categories Controller
 * Returns distinct parent/child category pairs with custom ordering
 */

class CategoriesController {
    private Database $db;
    private Cache $cache;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->cache = new Cache();
    }
    
    /**
     * SQL expression to normalize Turkish characters
     */
    private function sqlNormalize(string $col): string {
        $expr = "LOWER({$col})";
        $chars = ['ş'=>'s', 'Ş'=>'s', 'ı'=>'i', 'İ'=>'i', 'ğ'=>'g', 'Ğ'=>'g', 'ü'=>'u', 'Ü'=>'u', 'ö'=>'o', 'Ö'=>'o', 'ç'=>'c', 'Ç'=>'c'];
        foreach ($chars as $from => $to) {
            $expr = "REPLACE({$expr}, '{$from}', '{$to}')";
        }
        return $expr;
    }
    
    public function index(): void {
        // Try cache first
        $cacheKey = Cache::key('categories');
        $cached = $this->cache->get($cacheKey);
        
        if ($cached !== null) {
            Response::json($cached, 200, ['X-Cache-Hit' => 'true']);
        }
        
        // Build SQL with custom ordering
        $normParent = $this->sqlNormalize('parent_category');
        $normChild = $this->sqlNormalize('child_category');
        
        // Simpler alphabetical ordering: normalized parent then child (A→Z).
        // This avoids CPU-heavy CASE/LIKE ordering while keeping predictable
        // alphabetical listings for the frontend.
        $sql = "SELECT parent_category, child_category, COUNT(*) as cnt 
                FROM products 
                GROUP BY parent_category, child_category 
                ORDER BY {$normParent} ASC, {$normChild} ASC, parent_category, child_category";
        
        $categories = $this->db->fetchAll($sql);
        
        // Cache for 1 hour (categories don't change often)
        $this->cache->set($cacheKey, $categories, 3600);
        
        Response::json($categories, 200, ['X-Cache-Hit' => 'false']);
    }
}
