document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
  const { DATA, money, stars, escapeHTML, productCard, addToCart, qs } =
    window.Nova;
  const id = new URLSearchParams(location.search).get("id") || "p001";
  const p = DATA.products.find((x) => x.id === id);
  if (!p) { qs('#productDetail').textContent = '商品が見つかりません。'; return; }
  document.title = `${p.name} | NovaMart`;
  qs("#breadcrumbs").innerHTML =
    `<a href="index.html">ホーム</a><span>›</span><a href="products.html?category=${p.category}">${escapeHTML(p.categoryLabel)}</a><span>›</span><span>${escapeHTML(p.name)}</span>`;
  qs("#productDetail").innerHTML = `
    <div class="product-gallery"><div class="main-product-image${p.category === "books" ? " main-product-image--book" : ""}"><img id="mainProductImage" src="${p.image}" alt="${escapeHTML(p.name)}"><button class="wish-button large" type="button" data-wishlist="${p.id}" aria-label="お気に入りに追加">♡</button></div></div>
    <div class="product-info"><p class="eyebrow">${escapeHTML(p.categoryLabel)}</p><h1>${escapeHTML(p.name)}</h1><div class="rating">${stars(p.rating)} <span>${p.rating}（${p.reviews}件の評価）</span></div><p class="product-lead">${escapeHTML(p.summary)}</p><div class="price-block">${p.originalPrice ? `<span class="discount">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ""}<strong>${money.format(p.price)}</strong>${p.originalPrice ? `<span class="original-price">参考価格 ${money.format(p.originalPrice)}</span>` : ""}<small>税込</small></div><p class="stock-copy">在庫あり（残り${p.stock}点）</p><p class="delivery-copy"><strong>最短翌日お届け</strong><br>通常配送料：無料</p><ul class="feature-list">${p.features.map((f) => `<li>${escapeHTML(f)}</li>`).join("")}</ul></div>
    <aside class="buy-box"><p class="buy-box-price">${money.format(p.price)}</p><p class="delivery-copy"><strong>明日までにお届け</strong><br>東京都千代田区への配送</p><p class="stock-copy">在庫あり</p><label>数量<select id="detailQuantity">${Array.from({ length: 10 }, (_, i) => `<option>${i + 1}</option>`).join("")}</select></label><button class="button button-cart" type="button" id="detailAdd">カートに追加</button><button class="button button-buy" type="button" id="buyNow">今すぐ購入</button><dl class="seller-table"><div><dt>発送元</dt><dd>NovaMart</dd></div><div><dt>販売元</dt><dd>Nova Retail</dd></div><div><dt>返品</dt><dd>30日以内返品可</dd></div></dl></aside>`;
  qs("#descriptionPanel").innerHTML =
    `<h2>商品の説明</h2><p>${escapeHTML(p.description)}</p><div class="spec-grid">${p.features.map((f, i) => `<div><span>POINT ${String(i + 1).padStart(2, "0")}</span><strong>${escapeHTML(f)}</strong></div>`).join("")}</div>`;
  const related = DATA.products
    .filter((x) => x.category === p.category && x.id !== p.id)
    .slice(0, 4);
  qs("#relatedProducts").innerHTML = related.map(productCard).join("");
  qs("#detailAdd").addEventListener("click", () =>
    addToCart(p.id, Number(qs("#detailQuantity").value)),
  );
  qs("#buyNow").addEventListener("click", () => {
    addToCart(p.id, Number(qs("#detailQuantity").value));
    location.href = 'checkout.html';
  });
  async function renderReviews() {
    const [{reviews},{user:reviewUser}] = await Promise.all([NovaBackend.request('api/reviews/list.php?productId=' + encodeURIComponent(p.id)),NovaBackend.request('api/auth/me.php')]);
    qs('#reviewList').innerHTML = reviews.length ? reviews.map(r =>
      `<article class="review-card"><div class="review-avatar" aria-hidden="true">${escapeHTML(String(r.name).slice(0,1))}</div><div><strong>${escapeHTML(r.name)}</strong><div class="rating">${stars(Number(r.rating))}</div><h3>${escapeHTML(r.title)}</h3><p>${escapeHTML(r.body)}</p><small>${escapeHTML(r.createdAt)}</small>${reviewUser && Number(r.userId) === reviewUser.id ? `<button type="button" class="button button-ghost review-delete" data-review-delete="${Number(r.id)}">自分のレビューを削除</button>` : ""}</div></article>`
    ).join('') : '<p>まだレビューはありません。</p>';
  }
  renderReviews().catch(error => { qs('#reviewList').textContent = error.message; });
  qs('#reviewList').addEventListener('click',async event=>{
    const button=event.target.closest('[data-review-delete]');if(!button)return;
    button.disabled=true;
    try{await NovaBackend.post('api/reviews/delete.php',{id:Number(button.dataset.reviewDelete)});await renderReviews();window.Nova.toast('レビューを削除しました。','success');}
    catch(error){window.Nova.toast(error.message);button.disabled=false;}
  });
  qs('#reviewForm').addEventListener('submit', async e => {
    e.preventDefault(); const form = e.currentTarget; const button = form.querySelector('button[type="submit"]');
    if (!form.reportValidity()) return;
    const fd = new FormData(form); button.disabled = true;
    try {
      await NovaBackend.post('api/reviews/create.php', {productId: p.id, rating: Number(fd.get('rating')), title: fd.get('title'), body: fd.get('body')});
      form.reset(); await renderReviews(); window.Nova.toast('レビューを投稿しました', 'success');
    } catch(error) { window.Nova.toast(error.message); } finally { button.disabled = false; }
  });
});
