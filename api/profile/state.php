<?php
require_once __DIR__.'/../_common.php';require_method('GET');$uid=require_login();
$s=db()->prepare('SELECT address,postal_code,phone,country FROM customer_profiles WHERE id=?');$s->execute([$uid]);
$profile=$s->fetch()?:['address'=>'未登録','postal_code'=>'','phone'=>'','country'=>'日本'];
json_response(['ok'=>true,...$profile]);
