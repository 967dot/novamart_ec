<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('GET');
$userId = require_login();

$stmt = db()->prepare(
    'SELECT id, order_number AS orderNumber, total, status, created_at AS createdAt
     FROM orders
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC'
);
$stmt->execute([$userId]);
$orders = $stmt->fetchAll();

foreach ($orders as &$order) {
    $order['id'] = (int) $order['id'];
    $order['total'] = (int) $order['total'];
}
unset($order);

json_response(['ok' => true, 'orders' => $orders]);
