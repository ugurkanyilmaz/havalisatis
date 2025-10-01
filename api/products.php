<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sanitize.php';

// Helper: detect transient sqlite/PDO errors that may succeed if retried
function is_transient_db_error($e) {
    if (!$e) return false;
    $msg = strtolower($e->getMessage());
    // common transient messages
    $transients = ['database is locked', 'database disk image is malformed', 'busy', 'i/o error', 'unable to open database file'];
    foreach ($transients as $t) {
        if (strpos($msg, $t) !== false) return true;
    }
    return false;
}

function products_log($msg) {
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    error_log("[products] " . $msg . "\n", 3, $dir . '/api_errors.log');
}
// Always return JSON only
header('Content-Type: application/json; charset=utf-8');
$db = get_db();
$pdo = $db->getPdo();

// Helpers (defined once, not inside conditionals)
function normalize_img_url($s) {
    if ($s === null) return null;
    $s = trim((string)$s);
    if ($s === '') return null;
    if (preg_match('#^https?://#i', $s)) return $s;
    if (strpos($s, '//') === 0) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        return $scheme . ':' . $s;
    }
    if (strpos($s, '/') === 0) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        // Fallback to production host to avoid leaking localhost in JSON responses
        $host = $_SERVER['HTTP_HOST'] ?? 'havalielaletlerisatis.com';
        return $scheme . '://' . $host . $s;
    }
    if (preg_match('#^[^\s/]+\.[^\s/]+#', $s)) {
        return 'https://' . $s;
    }
    return $s;
}

$parent = isset($_GET['parent']) ? allow_alpha_numeric_space($_GET['parent'], 60) : null;
$child = isset($_GET['child']) ? allow_alpha_numeric_space($_GET['child'], 60) : null;
$q = isset($_GET['q']) ? clean_string($_GET['q'], 200) : null;
$sku = isset($_GET['sku']) ? clean_sku($_GET['sku']) : null;
$page = clean_int(isset($_GET['page']) ? $_GET['page'] : 1, 1, 1000, 1);
$per_page = clean_int(isset($_GET['per_page']) ? $_GET['per_page'] : 20, 1, 200, 20);
$offset = ($page - 1) * $per_page;

// SKU lookup: return a single JSON document and exit early
if ($sku) {
    try {
        $sql = "SELECT * FROM products WHERE sku = :sku LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':sku', $sku);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($product) {
            $imgFields = ['main_img','img1','img2','img3','img4'];
            foreach ($imgFields as $f) {
                if (array_key_exists($f, $product)) $product[$f] = normalize_img_url($product[$f]);
            }
            // Normalize common column name differences so frontend finds expected keys
            // Map product_description -> description
            if (array_key_exists('product_description', $product) && !array_key_exists('description', $product)) {
                $product['description'] = $product['product_description'];
            }
            // Map feature_1..feature_8 or feature1..feature8 to feature1..feature8
            for ($i = 1; $i <= 8; $i++) {
                $k1 = 'feature' . $i;
                $k2 = 'feature_' . $i;
                if (!array_key_exists($k1, $product) && array_key_exists($k2, $product)) {
                    $product[$k1] = $product[$k2];
                }
            }
            echo json_encode(['product' => $product], JSON_UNESCAPED_UNICODE);
            return;
        }
        // Not found
        http_response_code(404);
        echo json_encode(['error' => 'Ürün bulunamadı', 'sku' => $sku], JSON_UNESCAPED_UNICODE);
        return;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        return;
    }
}

$maxAttempts = 3;
$attempt = 0;
$lastEx = null;
for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
    try {
        // Base where (parent/child) used for candidate selection and for no-q queries
        // Make comparisons more tolerant and, when both parent and child are present
        // but no text query, fetch by parent only and filter child in PHP. This
        // avoids subtle SQL mismatches caused by punctuation/unicode differences.
        $whereBase = [];
        $paramsBase = [];
        $filterChildInPhp = false;
        if ($parent) {
            // case-insensitive parent match (use LIKE to tolerate minor differences)
            $whereBase[] = 'LOWER(parent_category) LIKE :parent';
            $paramsBase[':parent'] = '%' . mb_strtolower($parent, 'UTF-8') . '%';
        }
        if ($child) {
            if ($parent && !$q) {
                // fetch candidates by parent only, then filter child matches in PHP
                $filterChildInPhp = true;
            } else {
                // when no parent or when a text query is present, include child in SQL
                $whereBase[] = 'LOWER(child_category) LIKE :child';
                $paramsBase[':child'] = '%' . mb_strtolower($child, 'UTF-8') . '%';
            }
        }

        if ($q) {
        // Normalize Turkish characters for search: both input and columns are normalized
        function php_normalize_search($s) {
            $map = [
                'ş' => 's', 'ı' => 'i', 'ğ' => 'g', 'ü' => 'u', 'ö' => 'o', 'ç' => 'c',
                'Ş' => 's', 'İ' => 'i', 'Ğ' => 'g', 'Ü' => 'u', 'Ö' => 'o', 'Ç' => 'c'
            ];
            $s = mb_strtolower((string)$s, 'UTF-8');
            return strtr($s, $map);
        }

        // SQL expression to normalize a column (lowercase + replace turkish chars)
        function sql_normalize_col($col) {
            // apply LOWER first, then REPLACE for each turkish char
            $expr = "LOWER($col)";
            $replacements = ['ş'=>'s','ı'=>'i','ğ'=>'g','ü'=>'u','ö'=>'o','ç'=>'c'];
            foreach ($replacements as $from => $to) {
                $expr = "REPLACE($expr, '$from', '$to')";
            }
            return $expr;
        }

    $normTitle = sql_normalize_col('title');
    $normSku = sql_normalize_col('sku');
    $normBrand = sql_normalize_col('brand');
    $normTags = sql_normalize_col('tags');
    $normParent = sql_normalize_col('parent_category');
    $normChild = sql_normalize_col('child_category');

    $where[] = "($normTitle LIKE :q OR $normSku LIKE :q OR $normBrand LIKE :q OR $normTags LIKE :q OR $normParent LIKE :q OR $normChild LIKE :q)";
        $params[':q'] = '%' . php_normalize_search($q) . '%';
    }

    // When q is present we will perform text filtering in PHP to avoid SQLite
    // unicode/locale issues. Use only parent/child filters for the candidate set.
    $whereSqlBase = count($whereBase) ? 'WHERE ' . implode(' AND ', $whereBase) : '';
    // Build the SQL expression with q if needed later (used only for non-q path)
    $whereSql = '';
    $params = $paramsBase;

    // If a text query is provided, fetch a larger candidate set and perform
    // normalized filtering in PHP to avoid SQLite locale/case-folding issues
    if ($q) {
    // fetch candidates applying only parent/child filters (no q in SQL)
    // order candidates by sku (case-insensitive) for predictable results
    $sql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category, tags FROM products $whereSqlBase ORDER BY LOWER(sku) ASC";
    $stmt = $pdo->prepare($sql);
    foreach ($paramsBase as $k => $v) $stmt->bindValue($k, $v);
    $stmt->execute();
        $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // normalize function (reuse php_normalize_search from above scope)
        function php_normalize_search_local($s) {
            $map = [
                'ş' => 's', 'ı' => 'i', 'ğ' => 'g', 'ü' => 'u', 'ö' => 'o', 'ç' => 'c',
                'Ş' => 's', 'İ' => 'i', 'Ğ' => 'g', 'Ü' => 'u', 'Ö' => 'o', 'Ç' => 'c'
            ];
            $s = mb_strtolower((string)$s, 'UTF-8');
            return strtr($s, $map);
        }

        // First try: match using the original query (case-insensitive, UTF-8)
        $origQ = mb_strtolower((string)$q, 'UTF-8');
        $filteredExact = array_filter($candidates, function($it) use ($origQ) {
            $fields = [$it['title'] ?? '', $it['sku'] ?? '', $it['brand'] ?? '', $it['tags'] ?? '', $it['parent_category'] ?? '', $it['child_category'] ?? ''];
            foreach ($fields as $f) {
                $fstr = mb_strtolower((string)$f, 'UTF-8');
                if ($fstr !== '' && mb_stripos($fstr, $origQ, 0, 'UTF-8') !== false) return true;
            }
            return false;
        });

        if (count($filteredExact) > 0) {
            $items_all = array_values($filteredExact);
        } else {
            // Fallback: replace Turkish chars in query and fields (ascii-folding)
            $normQ = php_normalize_search_local($q);
            $filtered = array_filter($candidates, function($it) use ($normQ) {
                $fields = [$it['title'] ?? '', $it['sku'] ?? '', $it['brand'] ?? '', $it['tags'] ?? '', $it['parent_category'] ?? '', $it['child_category'] ?? ''];
                foreach ($fields as $f) {
                    $nf = php_normalize_search_local($f);
                    if ($nf !== '' && mb_stripos($nf, $normQ, 0, 'UTF-8') !== false) return true;
                }
                return false;
            });
            $items_all = array_values($filtered);
        }
        $total = count($items_all);
        $start = ($page - 1) * $per_page;
        $items = array_slice($items_all, $start, $per_page);
    } else {
        // total count
        $countSql = "SELECT COUNT(*) FROM products $whereSqlBase";
        $stmt = $pdo->prepare($countSql);
        $stmt->execute($paramsBase);
        $total = intval($stmt->fetchColumn());

        // items (paginated)
        // Order listing by SKU alphabetically (case-insensitive)
        if ($filterChildInPhp && $child) {
            // Fetch all candidates for the parent and filter in PHP to avoid
            // missing matches outside the SQL LIMIT window. We'll paginate after filtering.
            $sql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category FROM products $whereSqlBase ORDER BY LOWER(sku) ASC";
            $stmt = $pdo->prepare($sql);
            foreach ($paramsBase as $k => $v) $stmt->bindValue($k, $v);
            $stmt->execute();
            $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // apply php-side normalization filter (re-use logic below)
            // normalizer: lowercase, replace common Turkish chars with ASCII
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
            $start = ($page - 1) * $per_page;
            $items = array_slice($items_all, $start, $per_page);
        } else {
            $sql = "SELECT id, sku, title, brand, main_img, list_price, discount, star_rating, parent_category, child_category FROM products $whereSqlBase ORDER BY LOWER(sku) ASC LIMIT :lim OFFSET :off";
            $stmt = $pdo->prepare($sql);
            foreach ($paramsBase as $k => $v) $stmt->bindValue($k, $v);
            $stmt->bindValue(':lim', $per_page, PDO::PARAM_INT);
            $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // If we decided to filter child in PHP (because parent+child were provided
        // but SQL child matching can be brittle due to punctuation/encoding),
        // apply a tolerant PHP-side filter here.
        if ($filterChildInPhp && $child) {
            // normalizer: lowercase, replace common Turkish chars with ASCII
            $map = ['ş'=>'s','ı'=>'i','ğ'=>'g','ü'=>'u','ö'=>'o','ç'=>'c','Ş'=>'s','İ'=>'i','Ğ'=>'g','Ü'=>'u','Ö'=>'o','Ç'=>'c'];
            $norm = function($s) use ($map) {
                $s = mb_strtolower((string)$s, 'UTF-8');
                $s = strtr($s, $map);
                // remove commas, multiple spaces and trim
                $s = preg_replace('/[\s,]+/u', ' ', $s);
                return trim($s);
            };
            $want = $norm($child);
            $filtered = array_filter($items, function($it) use ($want, $norm) {
                $c = isset($it['child_category']) ? $it['child_category'] : '';
                $c2 = $norm($c);
                // try contains with spaces normalized
                if ($c2 !== '' && mb_stripos($c2, $want, 0, 'UTF-8') !== false) return true;
                // fallback: remove spaces to match compact forms
                $compact = str_replace(' ', '', $c2);
                $wcompact = str_replace(' ', '', $want);
                return $compact !== '' && mb_stripos($compact, $wcompact, 0, 'UTF-8') !== false;
            });
            $items = array_values($filtered);
            $total = count($items);
        }
    }

    // Normalise image URLs server-side so frontend doesn't need to guess schemes/hosts.
    foreach ($items as &$it) {
        if (array_key_exists('main_img', $it)) {
            $it['main_img'] = normalize_img_url($it['main_img']);
        }
    }
    unset($it);

        echo json_encode(['total' => $total, 'page' => $page, 'per_page' => $per_page, 'items' => $items], JSON_UNESCAPED_UNICODE);
        // success -> break retry loop
        break;
    } catch (Exception $e) {
        $lastEx = $e;
        // log transient attempts and retry briefly
        if ($attempt < $maxAttempts && is_transient_db_error($e)) {
            products_log("transient error attempt {$attempt}: " . $e->getMessage());
            // brief backoff
            usleep(200000);
            continue;
        }
        // fatal or last attempt: log and return 500
        products_log("fatal error on attempt {$attempt}: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
        break;
    }
}


