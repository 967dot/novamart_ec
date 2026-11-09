document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
  const { cartDetails, money, setCartQuantity, removeFromCart, productCard, DATA, qs }=window.Nova;
  function totals(items){const subtotal=items.reduce((s,x)=>s+x.lineTotal,0);const shipping=subtotal===0?0:subtotal>=3500?0:550;return{subtotal,shipping,total:subtotal+shipping};}
  function render(){const items=cartDetails();const t=totals(items);const host=qs('#cartContent');
    if(!items.length){host.innerHTML=`<div class="empty-state large"><h1>カートは空です</h1><p>商品一覧から気になる商品を追加してください。</p><a class="button button-primary" href="products.html">商品を探す</a></div>`;return;}
    const remaining=Math.max(0,3500-t.subtotal);host.innerHTML=`<div class="cart-layout"><section><div class="free-shipping"><div class="progress"><span style="width:${Math.min(100,t.subtotal/3500*100)}%"></span></div><p>${remaining?`あと${money.format(remaining)}で配送料無料`:'配送料無料の対象です'}</p></div><div class="cart-items">${items.map(item=>`<article class="cart-item"><a href="product.html?id=${item.id}"><img src="${item.image}" alt="${item.name}"></a><div class="cart-item-info"><p class="eyebrow">${item.categoryLabel}</p><h2><a href="product.html?id=${item.id}">${item.name}</a></h2><p class="stock-copy">在庫あり</p><div class="cart-controls"><label>数量<select data-cart-quantity="${item.id}">${Array.from({length:10},(_,i)=>`<option ${i+1===item.quantity?'selected':''}>${i+1}</option>`).join('')}</select></label><button type="button" data-cart-remove="${item.id}">削除</button><button type="button" data-wishlist="${item.id}">お気に入りへ</button></div></div><strong class="cart-line-price">${money.format(item.lineTotal)}</strong></article>`).join('')}</div></section><aside class="order-summary"><h2>注文内容</h2><dl><div><dt>商品の小計</dt><dd>${money.format(t.subtotal)}</dd></div><div><dt>配送料</dt><dd>${t.shipping?money.format(t.shipping):'無料'}</dd></div><div class="total"><dt>ご請求額</dt><dd>${money.format(t.total)}</dd></div></dl><a class="button button-primary full" href="checkout.html">レジに進む</a><p>注文確定前に、配送先と支払い方法を確認できます。</p></aside></div>`;
  }
  document.addEventListener('change',e=>{const el=e.target.closest('[data-cart-quantity]');if(el)setCartQuantity(el.dataset.cartQuantity,Number(el.value));});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-cart-remove]');if(el){removeFromCart(el.dataset.cartRemove);window.Nova.toast('商品をカートから削除しました');}});
  window.addEventListener('novamart:cart-updated',render);render();
  qs('#cartRecommendations').innerHTML=DATA.products.filter(p=>p.featured).slice(0,4).map(productCard).join('');
});
