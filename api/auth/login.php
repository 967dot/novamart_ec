<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('POST');
require_csrf();

$input = json_input();
$email = mb_strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    json_response(['ok' => false, 'error' => 'メールアドレスまたはパスワードが正しくありません。'], 401);
}

$stmt = db()->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['ok' => false, 'error' => 'メールアドレスまたはパスワードが正しくありません。'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];

json_response(['ok' => true, 'user' => public_user($user)]);
