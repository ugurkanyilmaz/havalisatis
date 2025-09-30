<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
$db = get_db();
$pdo = $db->getPdo();

try {
    // Collect distinct tags from products.tags column. Tags are expected
    // to be comma-separated. We'll split, trim and return unique non-empty tags.
    $stmt = $pdo->query('SELECT tags FROM products WHERE tags IS NOT NULL AND tags != ""');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $set = [];
    foreach ($rows as $r) {
        $raw = $r['tags'] ?? '';
        // Split on comma and also allow semicolon separators just in case
        $parts = preg_split('/[,;]+/', $raw);
        foreach ($parts as $p) {
            $t = trim($p);
            if ($t === '') continue;
            // Normalize spacing and case for presentation but keep original case as-is
            $key = mb_strtolower($t, 'UTF-8');
            if (!array_key_exists($key, $set)) $set[$key] = $t;
        }
    }
    $tags = array_values($set);
    // Map specific tag keys to Turkish display labels (backend-side mapping)
    $mapping = [
        'popular' => 'Popüler',
        'special_price' => 'Özel Fiyat',
    ];
    // Build array of objects with original key and display label so frontend
    // can use the key for filtering while showing a localized label.
    $items = [];
    foreach ($tags as $t) {
        $k = mb_strtolower($t, 'UTF-8');
        $label = $mapping[$k] ?? $t;
        $items[] = ['key' => $k, 'label' => $label];
    }
    // Sort by label
    usort($items, function($a, $b){ return strcasecmp($a['label'], $b['label']); });
    echo json_encode(array_values($items), JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
