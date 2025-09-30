<?php
require_once __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');
$db = get_db();
$pdo = $db->getPdo();

try {
    // Return distinct parent_category and child_category pairs
    // We want a custom ordering for some parents so they appear in a meaningful sequence
    // Custom ordering: keep parent categories in a fixed order, and for
    // 'havalı el aletleri' apply a specific child_category sequence provided
    // by the product owner so the frontend shows subcategories in that order.
    // build normalized expressions for parent and child columns (lower + ascii-fold turkish chars)
    $norm_tpl = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(%s), 'ş', 's'), 'ı', 'i'), 'ğ', 'g'), 'ü', 'u'), 'ö', 'o'), 'ç', 'c')";
    $norm_parent = str_replace('%s', 'parent_category', $norm_tpl);
    $norm_child = str_replace('%s', 'child_category', $norm_tpl);

    // use normalized parent/child in ORDER BY to avoid Turkish-char ordering issues
    $sql = "SELECT parent_category, child_category, COUNT(*) as cnt FROM products GROUP BY parent_category, child_category ORDER BY 
        CASE " . $norm_parent . " 
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
        -- If parent is 'havali el aletleri' use a CASE to order child_category exactly (normalized)
        CASE WHEN " . $norm_parent . " = 'havali el aletleri' THEN 
            CASE 
                WHEN " . $norm_child . " LIKE '%somun s%' THEN 1
                WHEN " . $norm_child . " LIKE '%circir%' THEN 2
                WHEN " . $norm_child . " LIKE '%pop%' THEN 3
                WHEN " . $norm_child . " LIKE '%somunlu%' THEN 4
                WHEN " . $norm_child . " LIKE '%matkap%' THEN 5
                WHEN " . $norm_child . " LIKE '%tork ayar%' THEN 6
                WHEN " . $norm_child . " LIKE '%tork kontroll%' THEN 7
                WHEN " . $norm_child . " LIKE '%orbital zimpara%' THEN 8
                WHEN " . $norm_child . " LIKE '%havali zimpara%' THEN 9
                WHEN " . $norm_child . " LIKE '%taslama%' THEN 10
                WHEN " . $norm_child . " LIKE '%filex%' THEN 11
                WHEN " . $norm_child . " LIKE '%pah%' THEN 12
                WHEN " . $norm_child . " LIKE '%kanca%' THEN 13
                WHEN " . $norm_child . " LIKE '%koli%' THEN 14
                WHEN " . $norm_child . " LIKE '%yazma%' THEN 15
                WHEN " . $norm_child . " LIKE '%kalafat%' THEN 16
                WHEN " . $norm_child . " LIKE '%ege%' THEN 17
                WHEN " . $norm_child . " LIKE '%testere%' THEN 18
                WHEN " . $norm_child . " LIKE '%yankeski%' THEN 19
                WHEN " . $norm_child . " LIKE '%dokumcu tokmagi%' THEN 20
                WHEN " . $norm_child . " LIKE '%kilavuz%' THEN 21
                WHEN " . $norm_child . " LIKE '%mikser%' THEN 22
                WHEN " . $norm_child . " LIKE '%gres%' THEN 23
                ELSE 999 END
        ELSE 1000 END, parent_category, child_category";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
