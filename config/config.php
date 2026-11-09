<?php

declare(strict_types=1);

// DB接続情報は、環境変数 → config/config.local.php（Git管理外）の順に読み込む。
// パスワードはリポジトリに含めない。config/config.local.example.php をコピーして使う。
$local = is_file(__DIR__ . '/config.local.php') ? require __DIR__ . '/config.local.php' : [];

return [
    'db' => [
        'host' => getenv('NOVAMART_DB_HOST') ?: ($local['host'] ?? '127.0.0.1'),
        'port' => getenv('NOVAMART_DB_PORT') ?: ($local['port'] ?? '8889'),
        'name' => getenv('NOVAMART_DB_NAME') ?: ($local['name'] ?? 'novamart_chatgpt_secure'),
        'user' => getenv('NOVAMART_DB_USER') ?: ($local['user'] ?? 'nm_ec_secure'),
        'pass' => getenv('NOVAMART_DB_PASS') ?: ($local['pass'] ?? ''),
        'charset' => 'utf8mb4',
    ],
];
