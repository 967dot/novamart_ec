document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
  const { DATA, productCard, qs } = window.Nova;
  const hero = qs('#heroSlides');
  const dots = qs('#heroDots');
  let active = 0;
  hero.innerHTML = DATA.heroSlides.map((slide, index) => `
    <article class="hero-slide ${index===0?'is-active':''}" data-hero-slide="${index}">
      <img src="${slide.image}" alt="">
      <div class="container hero-copy ${slide.tone==='dark'?'hero-copy-dark':''}">
        <p class="eyebrow">${slide.eyebrow}</p><h1>${slide.title.replace('\n','<br>')}</h1><p>${slide.lead}</p><a class="button button-primary" href="${slide.href}">${slide.cta}</a>
      </div>
    </article>`).join('');
  dots.innerHTML = DATA.heroSlides.map((_,i)=>`<button type="button" data-hero-dot="${i}" aria-label="スライド${i+1}" class="${i===0?'is-active':''}"></button>`).join('');
  const show = index => {
    active = (index + DATA.heroSlides.length) % DATA.heroSlides.length;
    document.querySelectorAll('[data-hero-slide]').forEach((el,i)=>el.classList.toggle('is-active',i===active));
    document.querySelectorAll('[data-hero-dot]').forEach((el,i)=>el.classList.toggle('is-active',i===active));
  };
  document.addEventListener('click', e => {
    if (e.target.closest('[data-hero-next]')) show(active+1);
    if (e.target.closest('[data-hero-prev]')) show(active-1);
    const dot=e.target.closest('[data-hero-dot]'); if(dot) show(Number(dot.dataset.heroDot));
  });
  setInterval(()=>show(active+1),6500);

  qs('#categoryGrid').innerHTML = DATA.categories.map(c => `<a class="category-card" href="products.html?category=${c.id}"><img src="${c.image}" alt=""><div><strong>${c.name}</strong><span>商品を見る →</span></div></a>`).join('');
  qs('#newProducts').innerHTML = DATA.products.filter(p=>p.newArrival).slice(0,4).map(productCard).join('');

  const selectedLabels = [
    { label: '注目商品', className: 'is-featured' },
    { label: 'おすすめ', className: 'is-recommended' },
    { label: '新着', className: 'is-new' },
    { label: 'タイムセール', className: 'is-sale' }
  ];
  const selected = [...DATA.products]
    .sort((a,b) => (b.featured - a.featured) || (b.reviews - a.reviews))
    .slice(0,4);
  qs('#selectedProducts').innerHTML = selected.map((product,index) => `
    <div class="selected-product-item">
      <span class="selected-product-label ${selectedLabels[index].className}">${selectedLabels[index].label}</span>
      ${productCard(product)}
    </div>`).join('');
});
