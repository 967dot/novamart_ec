<?php

declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('NOVAMART_DB_HOST') ?: '127.0.0.1',
        'port' => getenv('NOVAMART_DB_PORT') ?: '8889',
        'name' => getenv('NOVAMART_DB_NAME') ?: 'novamart_chatgpt_secure',
        'user' => getenv('NOVAMART_DB_USER') ?: 'nm_ec_secure',
        'pass' => getenv('NOVAMART_DB_PASS') ?: 'NovaMart-Training-Only-2026',
        'charset' => 'utf8mb4',
    ],
];
