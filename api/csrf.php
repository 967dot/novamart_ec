<?php

declare(strict_types=1);

require_once __DIR__ . '/_common.php';
require_method('GET');

json_response(['ok' => true, 'csrfToken' => csrf_token()]);
