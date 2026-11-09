<?php
declare(strict_types=1);
require_once __DIR__.'/../_common.php';require_method('POST');require_csrf();$userId=require_login();$input=json_input();$id=$input['id']??null;
if(!is_int($id)||$id<1)json_response(['ok'=>false,'error'=>'レビューIDが不正です。'],422);
$stmt=db()->prepare('DELETE FROM reviews WHERE id=? AND user_id=?');$stmt->execute([$id,$userId]);
if($stmt->rowCount()!==1)json_response(['ok'=>false,'error'=>'レビューが見つかりません。自分の投稿だけを削除できます。'],404);
json_response(['ok'=>true]);
