<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('GET');

$q = trim((string) ($_GET['q'] ?? ''));
$category = trim((string) ($_GET['category'] ?? ''));
$maxPrice = max(0, min(500000, (int) ($_GET['maxPrice'] ?? 500000)));

$sql = 'SELECT id, name, category, category_label AS categoryLabel, price,
               original_price AS originalPrice, rating, reviews, stock, badge,
               image, summary, description, features_json AS featuresJson,
               new_arrival AS newArrival, featured
        FROM products
        WHERE price <= :maxPrice';
$params = ['maxPrice' => $maxPrice];

if ($q !== '') {
    // Search terms are bound as values (prepared statement), never concatenated into SQL.
    $sql .= ' AND (name LIKE :q1 OR summary LIKE :q2 OR description LIKE :q3)';
    foreach (['q1', 'q2', 'q3'] as $key) $params[$key] = '%' . $q . '%';
}
if ($category !== '') {
    $sql .= ' AND category = :category';
    $params['category'] = $category;
}

$sql .= ' ORDER BY featured DESC, rating DESC, id ASC LIMIT 200';
try {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    json_response(['ok' => false, 'error' => '検索できませんでした。時間をおいて再度お試しください。'], 400);
}

$products = array_map(static function (array $row): array {
    $row['price'] = (int) $row['price'];
    $row['originalPrice'] = $row['originalPrice'] !== null ? (int) $row['originalPrice'] : null;
    $row['rating'] = (float) $row['rating'];
    $row['reviews'] = (int) $row['reviews'];
    $row['stock'] = (int) $row['stock'];
    $row['newArrival'] = (bool) $row['newArrival'];
    $row['featured'] = (bool) $row['featured'];
    $row['features'] = json_decode((string) $row['featuresJson'], true) ?: [];
    unset($row['featuresJson']);
    return $row;
}, $rows);

json_response(['ok' => true, 'products' => $products]);
