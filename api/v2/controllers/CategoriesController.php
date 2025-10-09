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
        
        $sql = "SELECT parent_category, child_category, COUNT(*) as cnt 
                FROM products 
                GROUP BY parent_category, child_category 
                ORDER BY 
                    -- Custom parent category ordering
                    CASE {$normParent}
                        WHEN 'havali el aletleri' THEN 1
                        WHEN 'akulu montaj aletleri' THEN 2
                        WHEN 'elektrikli aletler' THEN 3
                        WHEN 'sartlandirici' THEN 4
                        WHEN 'makarali hortumlar' THEN 5
                        WHEN 'sprial hava hortumlari' THEN 6
                        WHEN 'balancer' THEN 7
                        WHEN 'akrobat - radyel - teleskobik kollar' THEN 8
                        ELSE 999
                    END,
                    -- Custom child category ordering for 'Havalı El Aletleri'
                    CASE WHEN {$normParent} = 'havali el aletleri' THEN
                        CASE
                            WHEN {$normChild} LIKE '%somun s%' THEN 1
                            WHEN {$normChild} LIKE '%circir%' THEN 2
                            WHEN {$normChild} LIKE '%pop%' THEN 3
                            WHEN {$normChild} LIKE '%somunlu%' THEN 4
                            WHEN {$normChild} LIKE '%matkap%' THEN 5
                            WHEN {$normChild} LIKE '%tork ayar%' THEN 6
                            WHEN {$normChild} LIKE '%tork kontroll%' THEN 7
                            WHEN {$normChild} LIKE '%orbital zimpara%' THEN 8
                            WHEN {$normChild} LIKE '%havali zimpara%' THEN 9
                            WHEN {$normChild} LIKE '%taslama%' THEN 10
                            WHEN {$normChild} LIKE '%filex%' THEN 11
                            WHEN {$normChild} LIKE '%pah%' THEN 12
                            WHEN {$normChild} LIKE '%kanca%' THEN 13
                            WHEN {$normChild} LIKE '%koli%' THEN 14
                            WHEN {$normChild} LIKE '%yazma%' THEN 15
                            WHEN {$normChild} LIKE '%kalafat%' THEN 16
                            WHEN {$normChild} LIKE '%ege%' THEN 17
                            WHEN {$normChild} LIKE '%testere%' THEN 18
                            WHEN {$normChild} LIKE '%yankeski%' THEN 19
                            WHEN {$normChild} LIKE '%dokumcu tokmagi%' THEN 20
                            WHEN {$normChild} LIKE '%kilavuz%' THEN 21
                            WHEN {$normChild} LIKE '%mikser%' THEN 22
                            WHEN {$normChild} LIKE '%gres%' THEN 23
                            ELSE 999
                        END
                    ELSE 1000
                    END,
                    parent_category,
                    child_category";
        
        $categories = $this->db->fetchAll($sql);
        
        // Cache for 1 hour (categories don't change often)
        $this->cache->set($cacheKey, $categories, 3600);
        
        Response::json($categories, 200, ['X-Cache-Hit' => 'false']);
    }
}
