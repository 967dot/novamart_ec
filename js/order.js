document.addEventListener('DOMContentLoaded',async()=>{
 const host=document.querySelector('#orderContent'),e=window.Nova.escapeHTML;
 try{const {order:o,items,subtotal,shipping}=await NovaBackend.request('api/orders/detail.php?id='+encodeURIComponent(new URLSearchParams(location.search).get('id')||''));
 host.innerHTML=`<section class="account-card"><h2>${e(o.order_number)}</h2><p>注文者：<strong>${e(o.name)}</strong></p><p>メール：${e(o.email)}</p><p>配送先：${e(o.postal_code || "")} ${e(o.address)} / ${e(o.country || "")}</p><p>電話番号：${e(o.phone || "未登録")}</p><p>状態：${e(o.status)}</p><p>合計：${Number(o.total).toLocaleString('ja-JP')}円</p><h3>注文商品</h3>${items.map(i=>`<p>${e(i.product_name)}：単価 ${Number(i.unit_price).toLocaleString('ja-JP')}円 × ${Number(i.quantity)}点 = ${Number(i.line_total).toLocaleString('ja-JP')}円</p>`).join('')}<p>商品小計：${Number(subtotal).toLocaleString('ja-JP')}円 / 送料：${Number(shipping).toLocaleString('ja-JP')}円</p></section>`;
 }catch(error){host.textContent=error.message;}
});
