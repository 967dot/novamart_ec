document.addEventListener("DOMContentLoaded", async () => {
  const { qs, money, escapeHTML, setUser } = window.Nova;
  const host = qs("#accountContent");

  const getJSON = async (url) => {
    const response = await fetch(url, { credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "通信に失敗しました。");
    return data;
  };

  try {
    const me = await getJSON("api/auth/me.php");
    const user = me.user;

    if (!user) {
      setUser(null);
      host.innerHTML = `<div class="empty-state large"><h1>アカウントへログイン</h1><p>注文履歴や登録情報を確認するにはログインしてください。</p><a class="button button-primary" href="login.html">ログイン</a></div>`;
      return;
    }

    setUser(user);
    const orderData = await getJSON("api/orders/list.php");
    const orders = orderData.orders;

    host.innerHTML = `<div class="account-header"><div class="account-avatar">${escapeHTML(user.name.slice(0, 1).toUpperCase())}</div><div><p>こんにちは</p><h1>${escapeHTML(user.name)}さん</h1><span>${escapeHTML(user.email)}</span></div><button class="button button-ghost" id="logoutButton" type="button">ログアウト</button></div><div class="account-grid"><section class="account-card"><h2>注文履歴</h2>${orders.length ? orders.map((o) => `<article class="order-row"><div><small>注文番号</small><strong><a href="order.html?id=${o.id}">${escapeHTML(o.orderNumber)}</a></strong></div><div><small>注文日</small><strong>${escapeHTML(new Date(o.createdAt).toLocaleDateString("ja-JP"))}</strong></div><div><small>合計</small><strong>${money.format(o.total)}</strong></div><span class="status-chip">${escapeHTML(o.status)}</span></article>`).join("") : `<p class="muted">まだ注文履歴はありません。</p>`}</section><section class="account-card"><h2>登録情報</h2><dl class="profile-list"><div><dt>お名前</dt><dd>${escapeHTML(user.name)}</dd></div><div><dt>メールアドレス</dt><dd>${escapeHTML(user.email)}</dd></div></dl></section></div>`;

    const profile=await getJSON('api/profile/state.php');
    const panel=document.createElement('section');panel.className='account-card';
    panel.innerHTML=`<h2>配送先住所・連絡先</h2><p id="profileContact"></p><p id="currentAddress"></p><form id="addressForm"><label>新しい配送先<input name="address" maxlength="200" required></label><button class="button button-primary">配送先を保存</button></form><p id="addressResult" role="status"></p>`;
    host.append(panel);qs('#profileContact').textContent='郵便番号：'+(profile.postal_code||'未登録')+' / 国・地域：'+profile.country+' / 電話：'+(profile.phone||'未登録');qs('#currentAddress').textContent=profile.address;panel.querySelector('input').value=profile.address;
    qs('#addressForm').addEventListener('submit',async event=>{event.preventDefault();try{const data=await NovaBackend.post('api/profile/update.php',{address:new FormData(event.currentTarget).get('address')});qs('#currentAddress').textContent=data.address;qs('#addressResult').textContent='配送先を保存しました。';}catch(error){qs('#addressResult').textContent=error.message;}});
    qs("#logoutButton").addEventListener("click", async () => {
      const csrf = await getJSON("api/csrf.php");
      await fetch("api/auth/logout.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRF-Token": csrf.csrfToken },
      });
      setUser(null);
      location.href = "index.html";
    });
  } catch (error) {
    host.innerHTML = `<div class="empty-state large"><h1>読み込みエラー</h1><p>${escapeHTML(error.message)}</p></div>`;
  }
});
