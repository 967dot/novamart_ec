<?php
declare(strict_types=1);
// Local development only: reject requests that do not come from this machine.
function nova_is_loopback(string $ip): bool {
    return in_array($ip, ['127.0.0.1', '::1', '::ffff:127.0.0.1'], true);
}
if (PHP_SAPI !== 'cli') {
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if (!nova_is_loopback($_SERVER['REMOTE_ADDR'] ?? '') ||
        !preg_match('/^(localhost|127\.0\.0\.1|\[::1\])(:[0-9]+)?$/D', $host)) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        exit('NovaMart is available on localhost only.');
    }
}
