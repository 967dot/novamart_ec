<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$db='novamart_chatgpt_secure';$user='nm_ec_secure';
$socket=getenv('NOVAMART_DB_SOCKET');
$dsn=$socket?'mysql:unix_socket='.$socket.';charset=utf8mb4':'mysql:host=127.0.0.1;port=8889;charset=utf8mb4';
$p=new PDO($dsn,getenv('NOVAMART_SETUP_DB_USER')?:'root',getenv('NOVAMART_SETUP_DB_PASS')?:'root',[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
$s=$p->prepare('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');$s->execute([$db]);
if($s->fetchColumn()){fwrite(STDERR,"DB already exists. No data was changed. This setup does not reset data.\n");exit(1);}
$s=$p->prepare('SELECT user FROM mysql.user WHERE user=?');$s->execute([$user]);
if($s->fetchColumn()){fwrite(STDERR,"DB user already exists. No data was changed.\n");exit(1);}
$schema=file_get_contents(__DIR__.'/../sql/schema.sql');$schema=substr($schema,strpos($schema,'CREATE TABLE'));
$p->exec("CREATE DATABASE `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");$p->exec("USE `$db`");
foreach(explode(';',$schema) as $sql)if(trim($sql)!=='')$p->exec($sql);
$products=json_decode(file_get_contents(__DIR__.'/../sql/seed-data.json'),true,512,JSON_THROW_ON_ERROR);
$columns=array_keys($products[0]);$stmt=$p->prepare('INSERT INTO products (`'.implode('`,`',$columns).'`) VALUES ('.implode(',',array_fill(0,count($columns),'?')).')');foreach($products as $row)$stmt->execute(array_values($row));
$users=json_decode(file_get_contents(__DIR__.'/../sql/demo-users.json'),true,512,JSON_THROW_ON_ERROR);
$us=$p->prepare('INSERT INTO users(id,name,email,password_hash) VALUES (?,?,?,?)');
$ps=$p->prepare('INSERT INTO customer_profiles(id,name,email,address,postal_code,phone,country) VALUES (?,?,?,?,?,?,?)');
foreach($users as $u){$us->execute([$u['id'],$u['name'],$u['email'],password_hash($u['password'],PASSWORD_DEFAULT)]);$ps->execute([$u['id'],$u['name'],$u['email'],$u['address'],$u['postal_code'],$u['phone'],$u['country']]);}
$p->exec("INSERT INTO orders(id,order_number,user_id,total,status,created_at) VALUES (1001,'NM-2608-0001',1,148000,'発送準備中','2026-08-03 11:15:00'),(1002,'NM-2609-0002',2,34800,'配送済み','2026-09-12 15:15:00')");
$p->exec("INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES (1001,'p001','AeroBook Pro 14',148000,1,148000),(1002,'p002','NovaBuds Max',34800,1,34800)");
$orders=json_decode(file_get_contents(__DIR__.'/../sql/demo-orders.json'),true,512,JSON_THROW_ON_ERROR);
$os=$p->prepare('INSERT INTO orders(id,order_number,user_id,total,status,created_at) VALUES (?,?,?,?,?,?)');$is=$p->prepare('INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES (?,?,?,?,?,?)');
foreach($orders as $o){$os->execute([$o['id'],$o['orderNumber'],$o['userId'],$o['total'],$o['status'],$o['createdAt']]);foreach($o['items'] as $it)$is->execute([$o['id'],$it['id'],$it['name'],$it['unitPrice'],$it['quantity'],$it['lineTotal']]);}
$p->exec("INSERT INTO reviews(product_id,user_id,rating,title,body) VALUES ('p001',1,5,'使いやすいです','軽くて持ち運びやすい商品でした。')");
foreach(['localhost','127.0.0.1'] as $host){
$p->exec("CREATE USER '$user'@'$host' IDENTIFIED BY 'NovaMart-Training-Only-2026'");
foreach(['users','orders','order_items','reviews','customer_profiles'] as $table)$p->exec("GRANT SELECT,INSERT ON `$db`.`$table` TO '$user'@'$host'");
$p->exec("GRANT DELETE ON `$db`.reviews TO '$user'@'$host'");
$p->exec("GRANT SELECT,UPDATE(stock) ON `$db`.products TO '$user'@'$host'");$p->exec("GRANT UPDATE(address) ON `$db`.customer_profiles TO '$user'@'$host'");}
echo "Created $db with fictional users and orders.\n";
