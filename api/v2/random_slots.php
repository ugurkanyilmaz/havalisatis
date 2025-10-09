<?php
/**
 * API v2 - Random Slots
 * Returns two random child categories and up to 12 items for each.
 * GET /api/v2/random_slots.php
 */

require_once __DIR__ . '/bootstrap.php';

try {
    $rateLimiter = new RateLimiter();
    $rateLimiter->check();

    $db = Database::getInstance();

    // get all distinct parent/child pairs
    $pairs = $db->fetchAll("SELECT parent_category, child_category FROM products WHERE child_category IS NOT NULL GROUP BY parent_category, child_category");
    if (!is_array($pairs) || count($pairs) === 0) {
        Response::json(['slot1' => null, 'slot2' => null], 200);
        exit;
    }

    // pick two distinct random pairs
    $idxA = array_rand($pairs);
    $idxB = $idxA;
    $tries = 0;
    while ($idxB === $idxA && $tries < 10 && count($pairs) > 1) { $idxB = array_rand($pairs); $tries++; }

    $a = $pairs[$idxA];
    $b = $pairs[$idxB];

    $result = ['slot1' => null, 'slot2' => null];

    $fetchFor = function($pair) use ($db) {
        $parent = $pair['parent_category'] ?? '';
        $child = $pair['child_category'] ?? '';

        $params = ['%' . mb_strtolower($parent, 'UTF-8') . '%', '%' . mb_strtolower($child, 'UTF-8') . '%'];
        $sql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category FROM products WHERE LOWER(parent_category) LIKE ? AND LOWER(child_category) LIKE ? ORDER BY LOWER(sku) ASC LIMIT 12";
        $items = $db->fetchAll($sql, $params);
        if (!is_array($items) || count($items) === 0) {
            // fallback: fetch by parent and filter by child in PHP
            $byParent = $db->fetchAll("SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category FROM products WHERE LOWER(parent_category) LIKE ? ORDER BY LOWER(sku) ASC", ['%' . mb_strtolower($parent, 'UTF-8') . '%']);
            $map = ['ş'=>'s','ı'=>'i','ğ'=>'g','ü'=>'u','ö'=>'o','ç'=>'c','Ş'=>'s','İ'=>'i','Ğ'=>'g','Ü'=>'u','Ö'=>'o','Ç'=>'c'];
            $norm = function($s) use ($map) {
                $s = mb_strtolower((string)$s, 'UTF-8');
                return strtr($s, $map);
            };
            $want = $norm($child);
            $filtered = array_filter($byParent, function($it) use ($want, $norm) {
                $c = isset($it['child_category']) ? $it['child_category'] : '';
                $c2 = $norm($c);
                if ($c2 !== '' && mb_stripos($c2, $want, 0, 'UTF-8') !== false) return true;
                $compact = str_replace(' ', '', $c2);
                $wcompact = str_replace(' ', '', $want);
                return $compact !== '' && mb_stripos($compact, $wcompact, 0, 'UTF-8') !== false;
            });
            $items = array_values($filtered);
            if (count($items) > 12) $items = array_slice($items, 0, 12);
        }

        return ['category' => ['parent' => $parent, 'child' => $child], 'items' => $items];
    };

    $result['slot1'] = $fetchFor($a);
    $result['slot2'] = $fetchFor($b);

    Response::json($result, 200);

} catch (Exception $e) {
    error_log('[API v2] random_slots error: ' . $e->getMessage());
    Response::serverError('Unable to fetch random slots');
}
