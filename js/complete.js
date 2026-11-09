document.addEventListener('DOMContentLoaded', async () => {
  const {qs,money,escapeHTML:e} = window.Nova;
  try {
    const {user} = await NovaBackend.request('api/auth/me.php');
    const cached = JSON.parse(sessionStorage.getItem('novamart_secure_last_order') || 'null');
    const data = user ? await NovaBackend.request('api/orders/list.php') : {orders:[]};
    const order = cached && data.orders.find(o => o.id === cached.id);
    if (!order) {qs('#completeContent').textContent='注文情報が見つかりません。';return;}
    const detail = await NovaBackend.request('api/orders/detail.php?id='+encodeURIComponent(order.id));
    qs('#completeContent').innerHTML = `<div class="complete-card"><div class="complete-icon">✓</div><h1>模擬注文を受け付けました</h1><p>注文番号 <strong>${e(order.orderNumber)}</strong></p><p>以下はDBに保存された注文の内容です。請求・発送は行いません。</p>${detail.items.map(i=>`<p>${e(i.product_name)}：単価 <strong>${money.format(Number(i.unit_price))}</strong> × ${Number(i.quantity)}点</p>`).join('')}<p>商品小計 ${money.format(detail.subtotal)} ＋ 送料 ${money.format(detail.shipping)}</p><p class="saved-order-total">保存された注文合計：<strong>${money.format(order.total)}</strong></p><div class="button-row"><a class="button button-primary" href="order.html?id=${order.id}">この注文の詳細を見る</a><a class="button button-secondary" href="account.html">注文履歴を見る</a></div></div>`;
  } catch(error) { qs('#completeContent').textContent = error.message; }
});
