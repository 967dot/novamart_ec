<?php
require_once __DIR__.'/../_common.php';require_method('POST');$uid=require_login();
require_csrf();
$input=str_contains($_SERVER['CONTENT_TYPE']??'','application/json')?json_input():$_POST;
$address=trim((string)($input['address']??''));
if($address===''||mb_strlen($address)>200) json_response(['ok'=>false,'error'=>'住所は1〜200文字で入力してください。'],422);
$s=db()->prepare('INSERT INTO customer_profiles(id,name,email,address) SELECT id,name,email,? FROM users WHERE id=? ON DUPLICATE KEY UPDATE address=VALUES(address)');$s->execute([$address,$uid]);
json_response(['ok'=>true,'address'=>$address]);
