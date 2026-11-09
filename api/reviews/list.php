<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('GET');

$productId = trim((string) ($_GET['productId'] ?? ''));
if ($productId === '') {
    json_response(['ok' => false, 'error' => 'productId is required'], 422);
}

$stmt = db()->prepare(
    'SELECT r.id, r.user_id AS userId, r.product_id AS productId, r.rating, r.title, r.body,
            r.created_at AS createdAt, u.name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.id DESC'
);
$stmt->execute([$productId]);
$reviews = $stmt->fetchAll();

json_response(['ok' => true, 'reviews' => $reviews]);
