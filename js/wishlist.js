document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }const {DATA,getWishlist,productCard,qs}=window.Nova;function render(){const set=new Set(getWishlist());const items=DATA.products.filter(p=>set.has(p.id));qs('#wishlistGrid').innerHTML=items.length?items.map(productCard).join(''):`<div class="empty-state large"><h1>お気に入りはまだありません</h1><p>商品カードの♡ボタンから追加できます。</p><a class="button button-primary" href="products.html">商品を探す</a></div>`;}document.addEventListener('click',e=>{if(e.target.closest('[data-wishlist]'))setTimeout(render,0)});render();});
