<?php
/**
 * Tags Controller
 * Returns distinct tags with Turkish labels
 */

class TagsController {
    private Database $db;
    private Cache $cache;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->cache = new Cache();
    }
    
    public function index(): void {
        // Try cache first
        $cacheKey = Cache::key('tags');
        $cached = $this->cache->get($cacheKey);
        
        if ($cached !== null) {
            Response::json($cached, 200, ['X-Cache-Hit' => 'true']);
        }
        
        // Fetch all tags from products
        $rows = $this->db->fetchAll(
            'SELECT tags FROM products WHERE tags IS NOT NULL AND tags != ""'
        );
        
        // Parse comma/semicolon separated tags
        $tagSet = [];
        foreach ($rows as $row) {
            $raw = $row['tags'] ?? '';
            // Split on comma or semicolon
            $parts = preg_split('/[,;]+/', $raw);
            
            foreach ($parts as $part) {
                $tag = trim($part);
                if ($tag === '') continue;
                
                // Use lowercase as key for deduplication
                $key = mb_strtolower($tag, 'UTF-8');
                if (!isset($tagSet[$key])) {
                    $tagSet[$key] = $tag;
                }
            }
        }
        
        // Map specific tags to Turkish labels
        $labelMap = [
            'popular' => 'Popüler',
            'special_price' => 'Özel Fiyat',
            'new' => 'Yeni',
            'bestseller' => 'Çok Satan',
            'discount' => 'İndirimli',
        ];
        
        // Build result with key and label
        $result = [];
        foreach ($tagSet as $key => $originalTag) {
            $result[] = [
                'key' => $key,
                'label' => $labelMap[$key] ?? $originalTag,
            ];
        }
        
        // Sort by label (Turkish-aware)
        usort($result, function($a, $b) {
            return strcasecmp($a['label'], $b['label']);
        });
        
        // Cache for 1 hour
        $this->cache->set($cacheKey, $result, 3600);
        
        Response::json($result, 200, ['X-Cache-Hit' => 'false']);
    }
}
