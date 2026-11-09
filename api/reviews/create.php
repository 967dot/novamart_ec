<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('POST');
require_csrf();
$userId = require_login();

$input = json_input();
$productId = trim((string) ($input['productId'] ?? ''));
$rating = (int) ($input['rating'] ?? 0);
$title = trim((string) ($input['title'] ?? ''));
$body = trim((string) ($input['body'] ?? ''));

if (!preg_match('/^p\d{3}$/', $productId)) {
    json_response(['ok' => false, 'error' => '商品IDが不正です。'], 422);
}
if ($rating < 1 || $rating > 5) {
    json_response(['ok' => false, 'error' => '評価は1〜5で指定してください。'], 422);
}
if ($title === '' || mb_strlen($title) > 60 || $body === '' || mb_strlen($body) > 500) {
    json_response(['ok' => false, 'error' => 'レビュー内容を確認してください。'], 422);
}

$stmt = db()->prepare('INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$productId, $userId, $rating, $title, $body]);

json_response(['ok' => true, 'reviewId' => (int) db()->lastInsertId()], 201);
