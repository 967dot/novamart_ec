<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('GET');

$userId = current_user_id();
if (!$userId) {
    json_response(['ok' => true, 'user' => null]);
}

$stmt = db()->prepare('SELECT id, name, email FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    $_SESSION = [];
    json_response(['ok' => true, 'user' => null]);
}

json_response(['ok' => true, 'user' => public_user($user)]);
