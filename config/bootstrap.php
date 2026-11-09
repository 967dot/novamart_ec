<?php

declare(strict_types=1);

require_once __DIR__ . '/local_guard.php';
ini_set('display_errors', '0');
ini_set('session.use_strict_mode', '1');
session_name('novamart_ec');
error_reporting(E_ALL);

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

// Cookie path = this app's folder (works wherever the folder is placed under the document root)
$docRoot = rtrim(str_replace('\\', '/', (string) realpath($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
$appDir = str_replace('\\', '/', dirname(__DIR__));
$cookiePath = ($docRoot !== '' && str_starts_with($appDir, $docRoot)) ? substr($appDir, strlen($docRoot)) . '/' : '/';

session_set_cookie_params([
    'lifetime' => 0,
    'path' => $cookiePath,
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';

set_exception_handler(static function (Throwable $error): void {
    error_log((string) $error);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => '処理に失敗しました。DB設定とセットアップを確認してください。'], JSON_UNESCAPED_UNICODE);
});
