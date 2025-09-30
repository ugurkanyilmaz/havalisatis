<?php
// Quick test runner to invoke products.php logic with custom GET params.
// Usage: php tools/test_products_call.php

$_GET['parent'] = 'Havalı El Aletleri';
$_GET['child'] = 'Havalı Kılavuz Çekme';
// set small page size for quicker output
$_GET['page'] = '1';
$_GET['per_page'] = '10';

// Instead of including the full endpoint, directly open the sqlite DB and run
// diagnostic queries to see how parent/child values are stored and why the
// filters may not match.
require_once __DIR__ . '/../api/db.php';
require_once __DIR__ . '/../api/sanitize.php';
try {
	$db = get_db();
	$pdo = $db->getPdo();
	$parent = $_GET['parent'] ?? null;
	$child = $_GET['child'] ?? null;
	echo "Parent: [" . ($parent ?? '') . "]\n";
	echo "Child: [" . ($child ?? '') . "]\n\n";

	// Total count
	$cstmt = $pdo->query('SELECT COUNT(*) FROM products');
	$total = $cstmt->fetchColumn();
	echo "Total products in DB: " . intval($total) . "\n\n";

	// Show some distinct parent_category values (raw)
	$stmt = $pdo->prepare("SELECT DISTINCT parent_category FROM products LIMIT 30");
	$stmt->execute();
	$parents = $stmt->fetchAll(PDO::FETCH_COLUMN);
	echo "Distinct parent_category samples (raw):\n";
	foreach ($parents as $pp) echo " - [" . ($pp ?? '') . "]\n";

	echo "\nLooking for child_category rows containing normalized child...\n";
	// We'll fetch a few rows where child_category contains the child term (using various normalizations)
	$stmt2 = $pdo->prepare("SELECT id, sku, child_category FROM products WHERE LOWER(REPLACE(REPLACE(child_category, ',', ''), ' ', '')) LIKE :c LIMIT 20");
	$normChild = '%' . mb_strtolower(str_replace([' ', ','], '', $child), 'UTF-8') . '%';
	$stmt2->execute([':c' => $normChild]);
	$rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
	echo "Query param used for child LIKE: [" . $normChild . "]\n";
	echo "Found " . count($rows) . " rows:\n";
	foreach ($rows as $r) {
		echo " - id={$r['id']} sku={$r['sku']} child_category=[{$r['child_category']}]\n";
	}

	// Reproduce products.php whereBase construction and run the same COUNT query to see bound params
	$s_parent = isset($_GET['parent']) ? allow_alpha_numeric_space($_GET['parent'], 60) : null;
	$s_child = isset($_GET['child']) ? allow_alpha_numeric_space($_GET['child'], 60) : null;
	$whereBase = [];
	$paramsBase = [];
	if ($s_parent) {
		$whereBase[] = 'LOWER(parent_category) LIKE :parent';
		$paramsBase[':parent'] = '%' . mb_strtolower($s_parent, 'UTF-8') . '%';
	}
	if ($s_child) {
		$whereBase[] = 'LOWER(child_category) LIKE :child';
		$paramsBase[':child'] = '%' . mb_strtolower($s_child, 'UTF-8') . '%';
	}
	$whereSqlBase = count($whereBase) ? 'WHERE ' . implode(' AND ', $whereBase) : '';
	$countSql = "SELECT COUNT(*) FROM products $whereSqlBase";
	echo "\nReproduced COUNT SQL: " . $countSql . "\n";
	echo "Bound params: " . json_encode($paramsBase, JSON_UNESCAPED_UNICODE) . "\n";
	$stmtCount = $pdo->prepare($countSql);
	$stmtCount->execute($paramsBase);
	$cRes = $stmtCount->fetchColumn();
	echo "COUNT result: " . intval($cRes) . "\n";
	// parent-only
	if ($s_parent) {
		$pstmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE LOWER(parent_category) LIKE :p");
		$pstmt->execute([':p' => '%' . mb_strtolower($s_parent, 'UTF-8') . '%']);
		echo "Parent-only COUNT: " . intval($pstmt->fetchColumn()) . "\n";
	}
	// child-only
	if ($s_child) {
		$pstmt2 = $pdo->prepare("SELECT COUNT(*) FROM products WHERE LOWER(child_category) LIKE :c");
		$pstmt2->execute([':c' => '%' . mb_strtolower($s_child, 'UTF-8') . '%']);
		echo "Child-only COUNT: " . intval($pstmt2->fetchColumn()) . "\n";
	}
	echo "\nSome distinct child_category samples (first 80):\n";
	$c2 = $pdo->query("SELECT DISTINCT child_category FROM products LIMIT 80");
	$cc = $c2->fetchAll(PDO::FETCH_COLUMN);
	foreach ($cc as $cval) echo " - [".($cval ?? '')."]\n";

	echo "\nChild categories containing 'kılavuz' (case-insensitive LIKE '%kılavuz%'):\n";
	$stmt3 = $pdo->prepare("SELECT id, sku, child_category FROM products WHERE LOWER(child_category) LIKE :k LIMIT 40");
	$stmt3->execute([':k' => '%kılavuz%']);
	$r3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);
	echo "Found " . count($r3) . " rows:\n";
	foreach ($r3 as $r) echo " - id={$r['id']} sku={$r['sku']} child_category=[{$r['child_category']}]\n";

	echo "\nNow show their parent_category values:\n";
	$stmt4 = $pdo->prepare("SELECT id, sku, parent_category, child_category FROM products WHERE LOWER(child_category) LIKE :k LIMIT 40");
	$stmt4->execute([':k' => '%kılavuz%']);
	$r4 = $stmt4->fetchAll(PDO::FETCH_ASSOC);
	foreach ($r4 as $r) echo " - id={$r['id']} sku={$r['sku']} parent_category=[{$r['parent_category']}] child_category=[{$r['child_category']}]\n";
} catch (Exception $e) {
	echo "Error: " . $e->getMessage() . "\n";
}
