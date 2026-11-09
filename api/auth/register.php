<?php

declare(strict_types=1);

require_once __DIR__ . '/../_common.php';
require_method('POST');
require_csrf();

$input = json_input();
$name = trim((string) ($input['name'] ?? ''));
$email = mb_strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($name === '' || mb_strlen($name) > 80) {
    json_response(['ok' => false, 'error' => 'お名前を正しく入力してください。'], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255) {
    json_response(['ok' => false, 'error' => 'メールアドレスを正しく入力してください。'], 422);
}
if (mb_strlen($password) < 8 || mb_strlen($password) > 200) {
    json_response(['ok' => false, 'error' => 'パスワードは8文字以上で入力してください。'], 422);
}

$pdo = db();

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_response(['ok' => false, 'error' => 'このメールアドレスは既に登録されています。'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);

$userId = (int) $pdo->lastInsertId();
session_regenerate_id(true);
$_SESSION['user_id'] = $userId;

json_response([
    'ok' => true,
    'user' => ['id' => $userId, 'name' => $name, 'email' => $email],
], 201);
