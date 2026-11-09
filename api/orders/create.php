<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('POST');
require_csrf();
$userId = require_login();

$input = json_input();
$items = $input['items'] ?? [];
if (!is_array($items) || count($items) === 0 || count($items) > 50) {
    json_response(['ok' => false, 'error' => '注文商品がありません。'], 422);
}

$quantities = [];
foreach ($items as $item) {
    if (!is_array($item) || !is_string($item['id'] ?? null) ||
        !is_int($item['quantity'] ?? null) || $item['quantity'] < 1 || $item['quantity'] > 99) {
        json_response(['ok' => false, 'error' => '数量は1〜99の整数で指定してください。'], 422);
    }
    $id = $item['id'];
    $quantities[$id] = ($quantities[$id] ?? 0) + $item['quantity'];
    if ($quantities[$id] > 99) json_response(['ok' => false, 'error' => '同一商品の数量は99点までです。'], 422);
}
ksort($quantities); // Stable lock order reduces deadlocks.
$pdo = db();
$pdo->beginTransaction();

try {
    $normalized = [];
    $total = 0;
    $productStmt = $pdo->prepare('SELECT id, name, price, stock FROM products WHERE id = ? FOR UPDATE');

    foreach ($quantities as $productId => $quantity) {

        $productStmt->execute([$productId]);
        $product = $productStmt->fetch();
        if (!$product) {
            throw new RuntimeException('存在しない商品が含まれています。');
        }
        if ((int) $product['stock'] < $quantity) {
            throw new RuntimeException($product['name'] . ' の在庫が不足しています。');
        }

        $unitPrice = (int) $product['price'];
        $lineTotal = $unitPrice * $quantity;
        $total += $lineTotal;
        $normalized[] = [
            'id' => $productId,
            'name' => $product['name'],
            'quantity' => $quantity,
            'unitPrice' => $unitPrice,
            'lineTotal' => $lineTotal,
        ];
    }

    $subtotal = $total;
    $shipping = $subtotal >= 3500 ? 0 : 550;
    $total += $shipping;
    $orderNumber = 'NM-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

    $stmt = $pdo->prepare('INSERT INTO orders (order_number, user_id, total, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([$orderNumber, $userId, $total, '発送準備中']);
    $orderId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stockStmt = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    foreach ($normalized as $item) {
        $itemStmt->execute([
            $orderId,
            $item['id'],
            $item['name'],
            $item['unitPrice'],
            $item['quantity'],
            $item['lineTotal'],
        ]);
        $stockStmt->execute([$item['quantity'], $item['id']]);
    }

    $pdo->commit();
    json_response([
        'ok' => true,
        'order' => [
            'id' => $orderId,
            'orderNumber' => $orderNumber,
            'total' => $total,
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'status' => '発送準備中',
        ],
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['ok' => false, 'error' => $e instanceof RuntimeException && !($e instanceof PDOException) ? $e->getMessage() : '注文処理に失敗しました。'], 422);
}
