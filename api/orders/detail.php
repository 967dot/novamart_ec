<?php
require_once __DIR__ . '/../_common.php';
require_method('GET');
$uid = require_login();
$id = (int)($_GET['id'] ?? 0);
// Only the logged-in user's own orders can be viewed.
$sql = 'SELECT o.id,o.order_number,o.user_id,o.total,o.status,u.name,u.email,COALESCE(p.address,\'未登録\') AS address,p.postal_code,p.phone,p.country FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN customer_profiles p ON p.id=o.user_id WHERE o.id=? AND o.user_id=?';
$params = [$id, $uid];
$stmt = db()->prepare($sql);
$stmt->execute($params);
$order = $stmt->fetch();
if (!$order) json_response(['ok' => false, 'error' => '注文が見つかりません。閲覧できるのは自分の注文だけです。'], 404);
$stmt = db()->prepare('SELECT product_id,product_name,unit_price,quantity,line_total FROM order_items WHERE order_id=?');
$stmt->execute([$id]);
$items = $stmt->fetchAll();
$subtotal = array_sum(array_column($items, 'line_total'));
json_response(['ok' => true, 'order' => $order, 'items' => $items, 'subtotal' => $subtotal, 'shipping' => (int)$order['total'] - $subtotal]);
