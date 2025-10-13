<?php
/**
 * Products Controller
 * Modern, optimized products API
 */

class ProductsController {
    private Database $db;
    private Cache $cache;
    private array $config;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->cache = new Cache();
        $appConfig = require __DIR__ . '/../config/app.php';
        $this->config = $appConfig;
    }
    
    /**
     * Normalize Turkish characters for search (PHP side)
     * Example: "Şarjlı" becomes "sarjli"
     */
    private function normalizeTurkish(string $str): string {
        $map = [
            'ş' => 's', 'Ş' => 's',
            'ı' => 'i', 'İ' => 'i',
            'ğ' => 'g', 'Ğ' => 'g',
            'ü' => 'u', 'Ü' => 'u',
            'ö' => 'o', 'Ö' => 'o',
            'ç' => 'c', 'Ç' => 'c'
        ];
        $str = mb_strtolower($str, 'UTF-8');
        return strtr($str, $map);
    }
    
    /**
     * SQL expression to normalize a column (for database queries)
     * Returns: REPLACE(REPLACE(...LOWER(col)...))
     */
    private function sqlNormalizeColumn(string $col): string {
        $expr = "LOWER({$col})";
        $replacements = ['ş'=>'s', 'Ş'=>'s', 'ı'=>'i', 'İ'=>'i', 'ğ'=>'g', 'Ğ'=>'g', 'ü'=>'u', 'Ü'=>'u', 'ö'=>'o', 'Ö'=>'o', 'ç'=>'c', 'Ç'=>'c'];
        foreach ($replacements as $from => $to) {
            $expr = "REPLACE({$expr}, '{$from}', '{$to}')";
        }
        return $expr;
    }
    
    public function index(): void {
        // Get and validate params
        $parent = isset($_GET['parent']) ? Validator::alphaNumericSpace($_GET['parent']) : null;
        $child = isset($_GET['child']) ? Validator::alphaNumericSpace($_GET['child']) : null;
        $q = isset($_GET['q']) ? Validator::string($_GET['q'], 200) : null;
        $page = Validator::int($_GET['page'] ?? 1, 1, 1000, 1);
        $perPage = Validator::int($_GET['per_page'] ?? 24, 1, $this->config['pagination']['max_per_page'], $this->config['pagination']['default_per_page']);
        
        // Generate cache key
        $cacheKey = Cache::key('products', $parent, $child, $q, $page, $perPage);
        
        // Try cache first
        if ($this->config['cache']['enabled']) {
            $cached = $this->cache->get($cacheKey);
            if ($cached !== null) {
                Response::json($cached, 200, ['X-Cache-Hit' => 'true']);
            }
        }
        
        // Build query with Turkish character normalization (SQL-side)
        $where = [];
        $params = [];

        $filterChildInPhp = false;
        if ($parent) {
            $normParent = $this->sqlNormalizeColumn('parent_category');
            $where[] = "{$normParent} LIKE ?";
            $params[] = '%' . $this->normalizeTurkish($parent) . '%';
        }

        if ($child) {
            // If both parent and child are provided but there's no free-text query,
            // fetch candidates by parent only and perform a tolerant child match in PHP.
            // This mirrors the v1 behavior which avoids missing matches from SQL
            // due to punctuation/locale differences.
            if ($parent && empty($q)) {
                $filterChildInPhp = true;
            } else {
                $normChild = $this->sqlNormalizeColumn('child_category');
                $where[] = "{$normChild} LIKE ?";
                $params[] = '%' . $this->normalizeTurkish($child) . '%';
            }
        }

        if ($q) {
            $normTitle = $this->sqlNormalizeColumn('title');
            $normSku = $this->sqlNormalizeColumn('sku');
            $normBrand = $this->sqlNormalizeColumn('brand');
            $normTags = $this->sqlNormalizeColumn('tags');
            $normParentCat = $this->sqlNormalizeColumn('parent_category');
            $normChildCat = $this->sqlNormalizeColumn('child_category');

            $where[] = "({$normTitle} LIKE ? OR {$normSku} LIKE ? OR {$normBrand} LIKE ? OR {$normTags} LIKE ? OR {$normParentCat} LIKE ? OR {$normChildCat} LIKE ?)";
            $search = '%' . $this->normalizeTurkish($q) . '%';
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }
        
        $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        // If we are to filter child in PHP (parent+child provided but no text query),
        // fetch candidates by parent only and apply tolerant filtering in PHP.
        if ($filterChildInPhp && $child) {
            // Fetch all candidates for the parent (no LIMIT) then filter in PHP
            $candidates = $this->db->fetchAll(
                "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category 
                 FROM products 
                 WHERE " . $this->sqlNormalizeColumn('parent_category') . " LIKE ? 
                 ORDER BY LOWER(sku) ASC",
                ['%' . $this->normalizeTurkish($parent) . '%']
            );

            // Normalizer: lowercase and replace Turkish chars with ASCII equivalents
            $map = ['ş'=>'s','ı'=>'i','ğ'=>'g','ü'=>'u','ö'=>'o','ç'=>'c','Ş'=>'s','İ'=>'i','Ğ'=>'g','Ü'=>'u','Ö'=>'o','Ç'=>'c'];
            $norm = function($s) use ($map) {
                $s = mb_strtolower((string)$s, 'UTF-8');
                $s = strtr($s, $map);
                $s = preg_replace('/[\s,]+/u', ' ', $s);
                return trim($s);
            };

            $want = $norm($child);
            $filtered = array_filter($candidates, function($it) use ($want, $norm) {
                $c = isset($it['child_category']) ? $it['child_category'] : '';
                $c2 = $norm($c);
                if ($c2 !== '' && mb_stripos($c2, $want, 0, 'UTF-8') !== false) return true;
                $compact = str_replace(' ', '', $c2);
                $wcompact = str_replace(' ', '', $want);
                return $compact !== '' && mb_stripos($compact, $wcompact, 0, 'UTF-8') !== false;
            });

            $items_all = array_values($filtered);
            $total = count($items_all);
            $start = ($page - 1) * $perPage;
            $items = array_slice($items_all, $start, $perPage);
        } else {
            // Standard path: use SQL COUNT and paginated select (SQL-side normalization handles Turkish chars)
            $offset = ($page - 1) * $perPage;
            $total = (int)$this->db->fetchColumn("SELECT COUNT(*) FROM products $whereSql", $params);

            $items = $this->db->fetchAll(
                "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category 
                 FROM products 
                 $whereSql 
                 ORDER BY LOWER(sku) ASC 
                 LIMIT ? OFFSET ?",
                array_merge($params, [$perPage, $offset])
            );
        }
        
        $result = [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'items' => $items,
        ];
        
        // Cache result
        if ($this->config['cache']['enabled']) {
            $ttl = $q ? $this->config['cache']['search_ttl'] : $this->config['cache']['ttl'];
            $this->cache->set($cacheKey, $result, $ttl);
        }
        
        Response::json($result, 200, ['X-Cache-Hit' => 'false']);
    }
    
    public function show(string $sku): void {
        $sku = Validator::sku($sku);
        
        if (empty($sku)) {
            Response::badRequest('SKU is required');
        }
        
        // Try cache
        $cacheKey = Cache::key('product', $sku);
        $cached = $this->cache->get($cacheKey);
        
        if ($cached !== null) {
            Response::json(['product' => $cached], 200, ['X-Cache-Hit' => 'true']);
        }
        
        // Fetch from DB
        $product = $this->db->fetchOne(
            'SELECT * FROM products WHERE sku = ? LIMIT 1',
            [$sku]
        );
        
        if (!$product) {
            Response::notFound('Product not found');
        }
        
        // Cache it
        $this->cache->set($cacheKey, $product, 600); // 10 minutes
        
        Response::json(['product' => $product], 200, ['X-Cache-Hit' => 'false']);
    }
    
    /**
     * List all products or get single product by SKU
     * Used for admin panel
     */
    public function list(): void {
        Auth::require();
        
        $sku = isset($_GET['sku']) ? Validator::sku($_GET['sku']) : null;
        
        if ($sku) {
            // Get single product
            $product = $this->db->fetchOne(
                'SELECT * FROM products WHERE sku = ? LIMIT 1',
                [$sku]
            );
            Response::success(['product' => $product ?: null]);
        } else {
            // Get all products (descending order by ID)
            $products = $this->db->fetchAll(
                'SELECT * FROM products ORDER BY id DESC'
            );
            Response::success(['products' => $products, 'total' => count($products)]);
        }
    }
    
    /**
     * Update or insert a single product by SKU
     */
    public function update(): void {
        Auth::require();
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($input) || empty($input['sku'])) {
            Response::badRequest('Invalid JSON or missing sku');
        }
        
        $allowedFields = [
            'parent_category', 'child_category', 'sku', 'title', 'tags', 'discount', 'list_price', 'star_rating',
            'product_description', 'feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8',
            'brand', 'main_img', 'img1', 'img2', 'img3', 'img4', 'meta_title', 'meta_description', 'meta_keywords', 'schema_description'
        ];

        
        $row = [];
        foreach ($allowedFields as $f) {
            if (!array_key_exists($f, $input)) continue;
            $v = $input[$f];
            if (is_array($v) || is_object($v)) {
                $row[$f] = json_encode($v, JSON_UNESCAPED_UNICODE);
            } else {
                $row[$f] = $v;
            }
        }
        
        if (empty($row)) {
            Response::badRequest('No valid fields to update');
        }
        
        $pdo = $this->db->getConnection();
        
        try {
            // Try update first
            $updateFields = array_map(function($f) { return "$f = :$f"; }, array_keys($row));
            $sql = 'UPDATE products SET ' . implode(',', $updateFields) . ' WHERE sku = :sku';
            $stmt = $pdo->prepare($sql);
            foreach ($row as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->bindValue(':sku', $input['sku']);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                // Clear cache for this product
                $this->cache->delete(Cache::key('product', $input['sku']));
                Response::success(['sku' => $input['sku'], 'action' => 'updated'], 'Product updated successfully');
            }
            
            // Insert fallback
            $row['sku'] = $input['sku'];
            $fields = array_keys($row);
            $placeholders = array_map(function($f) { return ':' . $f; }, $fields);
            $sql = 'INSERT INTO products (' . implode(',', $fields) . ') VALUES (' . implode(',', $placeholders) . ')';
            $stmt = $pdo->prepare($sql);
            foreach ($row as $k => $v) {
                $stmt->bindValue(':' . $k, $v);
            }
            $stmt->execute();
            
            Response::success(['sku' => $input['sku'], 'action' => 'inserted'], 'Product inserted successfully');
            
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
    
    /**
     * Delete a product by SKU
     */
    public function delete(): void {
        Auth::require();
        
        $input = json_decode(file_get_contents('php://input'), true);
        $sku = isset($input['sku']) ? trim($input['sku']) : '';
        
        if ($sku === '') {
            Response::badRequest('SKU required');
        }
        
        try {
            $pdo = $this->db->getConnection();
            $stmt = $pdo->prepare('DELETE FROM products WHERE sku = :sku');
            $stmt->execute([':sku' => $sku]);
            
            $deleted = $stmt->rowCount();
            
            // Clear cache
            if ($deleted > 0) {
                $this->cache->delete(Cache::key('product', $sku));
            }
            
            Response::success(
                ['sku' => $sku, 'deleted' => $deleted],
                $deleted > 0 ? 'Product deleted successfully' : 'Product not found'
            );
            
        } catch (Exception $e) {
            Response::error($e->getMessage());
        }
    }
}
