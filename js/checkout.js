document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
  const { cartDetails, money, getUser, qs, KEYS, saveCart, escapeHTML } = window.Nova;
  const me = await NovaBackend.request('api/auth/me.php');
  window.Nova.setUser(me.user);
  if (!me.user) { qs('#checkoutContent').innerHTML = '<p>模擬注文にはログインしてください。</p><a href="login.html">ログインへ</a>'; return; }
  const items = cartDetails();
  if (!items.length) {
    qs("#checkoutContent").innerHTML =
      `<div class="empty-state large"><h1>購入する商品がありません</h1><a class="button button-primary" href="products.html">商品を探す</a></div>`;
    return;
  }
  const subtotal = items.reduce((s, x) => s + x.lineTotal, 0),
    shipping = subtotal >= 3500 ? 0 : 550,
    total = subtotal + shipping,
    user = getUser();
  qs("#checkoutContent").innerHTML =
    `<div class="checkout-layout"><form class="checkout-form" id="checkoutForm"><section class="checkout-section"><div class="step-number">1</div><div><h2>お届け先</h2><div class="form-grid two"><label class="form-group">お名前<input name="name" value="${escapeHTML(user?.name || "")}" required><span class="field-error"></span></label><label class="form-group">電話番号<input name="phone" inputmode="tel" placeholder="090-0000-0000" required><span class="field-error"></span></label><label class="form-group">郵便番号<input name="postal" placeholder="100-0001" required><span class="field-error"></span></label><label class="form-group">国・地域<input name="country" value="日本" required><span class="field-error"></span></label><label class="form-group full-span">配送先住所<input name="address" required><span class="field-error"></span></label></div></div></section><section class="checkout-section"><div class="step-number">2</div><div><h2>配送方法</h2><label class="choice-card"><input type="radio" name="shipping" value="standard" checked><span><strong>通常配送（送料は注文内容を参照）</strong><small>最短翌日のお届け</small></span></label><label class="choice-card">
  <input type="radio" name="shipping" value="time">
  <span>
    <strong>時間帯指定</strong>
    <small>お届け日と時間帯を指定できます</small>
  </span>
</label>

<div class="delivery-schedule" id="deliverySchedule" hidden>
  <label class="form-group">
    お届け日
    <input type="date" name="deliveryDate">
  </label>

  <label class="form-group">
    お届け時間帯
    <select name="deliveryTime">
      <option value="">時間帯を選択してください</option>
      <option value="8:00-12:00">8:00～12:00</option>
      <option value="12:00-14:00">12:00～14:00</option>
      <option value="14:00-16:00">14:00～16:00</option>
      <option value="16:00-18:00">16:00～18:00</option>
      <option value="18:00-20:00">18:00～20:00</option>
      <option value="19:00-21:00">19:00～21:00</option>
    </select>
  </label>
</div></div></section><section class="checkout-section">
  <div class="step-number">3</div>

  <div>
    <h2>模擬決済</h2><p>ポートフォリオ用の模擬注文です。請求・発送は行いません。</p><p>住所・氏名は架空の値を入力してください。配送先は保存されません。</p>
  </div>
</section><button class="button button-primary button-large full" type="submit">注文を確定する</button></form><aside class="order-summary sticky"><h2>注文内容</h2><div class="checkout-items">${items.map((x) => `<div><img src="${x.image}" alt=""><span>${x.name}<small>数量 ${x.quantity}</small></span><strong>${money.format(x.lineTotal)}</strong></div>`).join("")}</div><dl><div><dt>商品の小計</dt><dd>${money.format(subtotal)}</dd></div><div><dt>配送料</dt><dd>${shipping ? money.format(shipping) : "無料"}</dd></div><div class="total"><dt>ご請求額</dt><dd>${money.format(total)}</dd></div></dl></aside></div>`;
  const checkoutForm = qs('#checkoutForm');
  // Use the selected fictional user's actual contact data as form defaults.
  try {
    const profile = await NovaBackend.request('api/profile/state.php');
    checkoutForm.elements.phone.value = profile.phone || '';
    checkoutForm.elements.postal.value = profile.postal_code || '';
    checkoutForm.elements.country.value = profile.country || '日本';
    checkoutForm.elements.address.value = profile.address === '未登録' ? '' : profile.address;
  } catch (_) { /* Users can still fill the fictional address form manually. */ }

  /* 配送日時指定欄の表示・非表示 */

  const deliverySchedule = qs("#deliverySchedule");
  const deliveryDate = checkoutForm.elements.deliveryDate;
  const deliveryTime = checkoutForm.elements.deliveryTime;
  const shippingRadios = checkoutForm.querySelectorAll(
    'input[name="shipping"]',
  );

  /* 選択可能日は明日以降 */
  const earliestDeliveryDate = new Date();
  earliestDeliveryDate.setDate(earliestDeliveryDate.getDate() + 1);

  const year = earliestDeliveryDate.getFullYear();
  const month = String(earliestDeliveryDate.getMonth() + 1).padStart(2, "0");
  const day = String(earliestDeliveryDate.getDate()).padStart(2, "0");

  deliveryDate.min = `${year}-${month}-${day}`;

  const updateDeliverySchedule = () => {
    const isTimeDelivery = checkoutForm.elements.shipping.value === "time";

    deliverySchedule.hidden = !isTimeDelivery;
    deliveryDate.required = isTimeDelivery;
    deliveryTime.required = isTimeDelivery;

    if (!isTimeDelivery) {
      deliveryDate.value = "";
      deliveryTime.value = "";
    }
  };

  shippingRadios.forEach((radio) => {
    radio.addEventListener("change", updateDeliverySchedule);
  });

  updateDeliverySchedule();
  checkoutForm.addEventListener('submit', async e => {
    e.preventDefault(); if (!checkoutForm.reportValidity()) return;
    const button = checkoutForm.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const {order} = await NovaBackend.post('api/orders/create.php', {items: items.map(x => ({id:x.id, quantity:x.quantity}))});
      sessionStorage.setItem('novamart_secure_last_order', JSON.stringify({...order, userId: me.user.id}));
      saveCart([]); location.href = 'complete.html';
    } catch(error) { window.Nova.toast(error.message); button.disabled = false; }
  });
});
