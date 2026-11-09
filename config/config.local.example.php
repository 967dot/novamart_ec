<?php
// このファイルを config.local.php という名前でコピーし、パスワードを設定してください。
// config.local.php は .gitignore で除外しているため、GitHubには公開されません。
return [
    'host' => '127.0.0.1',
    'port' => '8889',                     // MAMPのMySQLポート
    'name' => 'novamart_chatgpt_secure',  // tools/setup.php が作成するDB名
    'user' => 'nm_ec_secure',             // tools/setup.php が作成するDBユーザー
    'pass' => 'change-me',                // 任意のパスワードに変更
];
