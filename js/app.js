(function () {
  "use strict";

  const DATA = window.NOVAMART_DATA;
  const KEYS = {
    cart: "novamart_secure_cart_v3",
    user: "novamart_secure_current_user_v3",
    reviews: "novamart_secure_reviews_v3",
    orders: "novamart_secure_orders_v3",
    wishlist: "novamart_secure_wishlist_v3",
  };
  const money = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  });

  const parse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  };
  const escapeHTML = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const pageName = () =>
    (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];

  function getCart() {
    const cart = parse(localStorage.getItem(KEYS.cart), []);
    return Array.isArray(cart)
      ? cart.filter((item) => DATA.products.some((p) => p.id === item.id))
      : [];
  }
  function saveCart(cart) {
    const normalized = cart.map((item) => ({
      id: item.id,
      quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
    }));
    localStorage.setItem(KEYS.cart, JSON.stringify(normalized));
    updateCartBadge();
    window.dispatchEvent(new CustomEvent("novamart:cart-updated"));
  }
  function addToCart(id, quantity = 1) {
    const product = DATA.products.find((p) => p.id === id);
    if (!product) return;
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (item)
      item.quantity = Math.min(
        99,
        item.quantity + Math.max(1, Number(quantity) || 1),
      );
    else cart.push({ id, quantity: Math.max(1, Number(quantity) || 1) });
    saveCart(cart);
    toast(`${product.name}をカートに追加しました`, "success");
  }
  function setCartQuantity(id, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    if (Number(quantity) <= 0) return removeFromCart(id);
    item.quantity = Math.max(
      1,
      Math.min(99, Math.round(Number(quantity) || 1)),
    );
    saveCart(cart);
  }
  function removeFromCart(id) {
    saveCart(getCart().filter((item) => item.id !== id));
  }
  function cartDetails() {
    return getCart()
      .map((item) => {
        const product = DATA.products.find((p) => p.id === item.id);
        return product
          ? {
              ...product,
              quantity: item.quantity,
              lineTotal: product.price * item.quantity,
            }
          : null;
      })
      .filter(Boolean);
  }
  function cartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }
  function updateCartBadge() {
    qsa("[data-cart-count]").forEach(
      (node) => (node.textContent = cartCount()),
    );
  }

  function getUser() {
    return parse(sessionStorage.getItem(KEYS.user), null);
  }
  function setUser(user) {
    if (user) sessionStorage.setItem(KEYS.user, JSON.stringify(user));
    else sessionStorage.removeItem(KEYS.user);
    renderAuthState();
  }
  function renderAuthState() {
    const user = getUser();
    qsa("[data-auth-name]").forEach(
      (node) => (node.textContent = user?.name || "ゲストさん"),
    );
    qsa("[data-auth-link]").forEach(
      (node) => (node.href = user ? "account.html" : "login.html"),
    );
  }

  function getWishlist() {
    return parse(localStorage.getItem(KEYS.wishlist), []);
  }
  function toggleWishlist(id) {
    const set = new Set(getWishlist());
    if (set.has(id)) {
      set.delete(id);
      toast("お気に入りから削除しました");
    } else {
      set.add(id);
      toast("お気に入りに追加しました", "success");
    }
    localStorage.setItem(KEYS.wishlist, JSON.stringify([...set]));
    renderWishlistState();
  }
  function renderWishlistState() {
    const set = new Set(getWishlist());
    qsa("[data-wishlist]").forEach((button) => {
      const active = set.has(button.dataset.wishlist);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      const label = button.querySelector("[data-wishlist-label]");
      if (label) label.textContent = active ? "お気に入り済み" : "お気に入り";
    });
  }

  function stars(rating) {
    const rounded = Math.round(rating);
    return `<span aria-hidden="true">${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}</span>`;
  }
  function discount(product) {
    return product.originalPrice
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;
  }
  function deliveryDaysFor(product) {
    if (product.stock >= 30) return 1;
    if (product.stock >= 15) return 2;
    return 3;
  }
  function shippingFeeFor(product) {
    return product.price >= 3500 ? 0 : 550;
  }
  function deliveryLabelFor(product) {
    const days = deliveryDaysFor(product);
    return days === 1 ? "最短翌日お届け" : `${days}日以内にお届け`;
  }
  function shippingLabelFor(product) {
    const fee = shippingFeeFor(product);
    return fee === 0 ? "配送料無料" : `送料${money.format(fee)}`;
  }
  function productCard(product, options = {}) {
    const wished = getWishlist().includes(product.id);
    return `
      <article class="product-card${product.category === "books" ? " product-card--book" : ""}" data-product-id="${escapeHTML(product.id)}">
        <div class="product-card-media-wrap">
          <a class="product-card-media" href="product.html?id=${encodeURIComponent(product.id)}">
            <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy">
            ${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ""}
          </a>
          <button class="wish-button${wished ? " is-active" : ""}" type="button" data-wishlist="${escapeHTML(product.id)}" aria-pressed="${wished}" aria-label="お気に入りに追加">♡</button>
        </div>
        <div class="product-card-body">
          <p class="product-card-category">${escapeHTML(product.categoryLabel)}</p>
          <h3 class="product-card-title"><a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a></h3>
          <div class="rating" aria-label="5点中${product.rating}点">${stars(product.rating)} <span>${product.rating}（${product.reviews}）</span></div>
          <p class="product-card-summary">${escapeHTML(product.summary)}</p>
          <div class="price-stack">
            ${discount(product) ? `<span class="discount">-${discount(product)}%</span>` : ""}
            <strong class="price">${money.format(product.price)}</strong>
            ${product.originalPrice ? `<span class="original-price">${money.format(product.originalPrice)}</span>` : ""}
          </div>
          <p class="shipping-copy">${deliveryLabelFor(product)}・${shippingLabelFor(product)}</p>
          <div class="product-card-actions">
            <button class="button button-primary button-small" type="button" data-add-to-cart="${escapeHTML(product.id)}">カートに追加</button>
            <button class="button button-ghost button-small" type="button" data-quick-view="${escapeHTML(product.id)}">詳細</button>
          </div>
        </div>
      </article>`;
  }

  function headerHTML() {
    const current = pageName();
    const nav = [
      {
        href: "products.html",
        label: "すべての商品",
        page: "products.html",
        category: "",
      },
      {
        href: "products.html?category=electronics",
        label: "家電・デジタル",
        page: "products.html",
        category: "electronics",
      },
      {
        href: "products.html?category=home",
        label: "ホーム・生活",
        page: "products.html",
        category: "home",
      },
      {
        href: "products.html?category=fashion",
        label: "ファッション",
        page: "products.html",
        category: "fashion",
      },
      {
        href: "products.html?category=gaming",
        label: "ゲーム",
        page: "products.html",
        category: "gaming",
      },
      {
        href: "products.html?category=books",
        label: "本・学習",
        page: "products.html",
        category: "books",
      },
      {
        href: "products.html?category=beauty",
        label: "美容・ケア",
        page: "products.html",
        category: "beauty",
      },
      {
        href: "guide.html",
        label: "ご利用ガイド",
        page: "guide.html",
        category: null,
      },
    ];
    const currentCategory =
      current === "products.html"
        ? new URLSearchParams(location.search).get("category") || ""
        : null;
    const guidePages = new Set([
      "guide.html",
      "shipping.html",
      "payment.html",
      "returns.html",
      "privacy.html",
      "terms.html",
    ]);
    const isCurrentNavItem = (item) => {
      if (item.page === "guide.html" && guidePages.has(current)) return true;
      if (item.page !== current) return false;
      if (item.page !== "products.html") return true;
      return item.category === currentCategory;
    };
    return `
      <header class="site-header">
        <div class="container header-main">
        <button
    class="mobile-menu-button"
    id="mobileMenuButton"
    type="button"
    aria-label="メニューを開閉"
    aria-expanded="false"
    aria-controls="primaryNav"
  >
    ☰
  </button>
          <a class="brand" href="index.html" aria-label="NovaMart ホーム"><img src="assets/icons/logo.svg" alt="NovaMart"></a>
          <button class="delivery-button" type="button" data-open-delivery><span class="delivery-icon" aria-hidden="true"><svg viewBox="0 0 24 24" role="img"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg></span><span class="delivery-copy"><small>お届け先</small><strong>東京都千代田区</strong></span></button>
          <form class="global-search" id="globalSearchForm" role="search">
            <label class="sr-only" for="globalCategory">カテゴリ</label>
            <select id="globalCategory" name="category"><option value="">すべて</option>${DATA.categories.map((c) => `<option value="${c.id}">${escapeHTML(c.short)}</option>`).join("")}</select>
            <label class="sr-only" for="globalSearchInput">商品を検索</label>
            <input id="globalSearchInput" name="q" type="search" placeholder="商品名、カテゴリ、キーワードから検索" autocomplete="off">
            <button type="submit" aria-label="検索"><span aria-hidden="true">⌕</span></button>
          </form>
          <div class="header-actions">
            <a class="header-action" data-auth-link href="login.html"><small>こんにちは、<span data-auth-name>ゲストさん</span></small><strong>アカウント</strong></a>
            <a class="header-action" href="account.html"><small>注文状況</small><strong>注文履歴</strong></a>
            <a class="header-action cart-link" href="cart.html"><span class="cart-visual" aria-hidden="true"><svg class="cart-icon" viewBox="0 0 48 38"><path class="cart-handle" d="M2.5 4.5h6.2l2.8 5.5"></path><path class="cart-basket" d="M10.6 10h31.2l-4.4 14.2H14.1L10.6 10Z"></path><path class="cart-base" d="M14.3 27.8h22.8"></path><circle cx="17.3" cy="33" r="2.2"></circle><circle cx="34.2" cy="33" r="2.2"></circle></svg><span class="cart-count" data-cart-count>0</span></span><strong>カート</strong></a>
          </div>
        </div>
        <nav class="site-nav" aria-label="商品カテゴリ"><div class="container nav-inner" id="primaryNav">${nav.map((item) => `<a href="${item.href}"${isCurrentNavItem(item) ? ' aria-current="page"' : ""}>${escapeHTML(item.label)}</a>`).join("")}</div></nav>
      </header>`;
  }
  function footerHTML() {
    return `
      <footer class="site-footer">
        <div class="container footer-main">
          <div class="footer-brand"><img src="assets/icons/logo.svg" alt="NovaMart"><p>暮らしを豊かにするオンラインストア。</p></div>
          <div><h2>ショッピング</h2><a href="products.html">商品一覧</a><a href="cart.html">カート</a><a href="wishlist.html">お気に入り</a><a href="account.html">注文履歴</a></div>
          <div><h2>ご利用ガイド</h2><a href="shipping.html">配送について</a><a href="payment.html">お支払い</a><a href="returns.html">返品・交換</a><a href="guide.html#faq">よくある質問</a></div>
          <div><h2>NovaMart</h2><a href="about.html">私たちについて</a><a href="guide.html">お問い合わせ</a><a href="privacy.html">プライバシー</a><a href="terms.html">利用規約</a></div>
        </div>
        <div class="container footer-bottom"><span>© 2026 NovaMart Inc.</span></div>
      </footer>`;
  }

  function ensureSharedUI() {
    const header = qs("[data-site-header]");
    const footer = qs("[data-site-footer]");
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    if (!qs("#globalModal"))
      document.body.insertAdjacentHTML(
        "beforeend",
        `
      <div class="modal-backdrop" id="globalModal" aria-hidden="true"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modal-header"><h2 id="modalTitle"></h2><button type="button" data-modal-close aria-label="閉じる">×</button></header><div class="modal-body" id="modalBody"></div></section></div>
      <div class="toast-region" id="toastRegion" aria-live="polite"></div>`,
      );
  }
  function openModal(title, html) {
    qs("#modalTitle").textContent = title;
    qs("#modalBody").innerHTML = html;
    qs("#globalModal").classList.add("is-open");
    qs("#globalModal").setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
  }
  function closeModal() {
    qs("#globalModal")?.classList.remove("is-open");
    qs("#globalModal")?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }
  function quickView(id) {
    const p = DATA.products.find((x) => x.id === id);
    if (!p) return;
    openModal(
      p.name,
      `<div class="quick-view"><img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}"><div><p class="eyebrow">${escapeHTML(p.categoryLabel)}</p><p>${escapeHTML(p.summary)}</p><div class="rating">${stars(p.rating)} <span>${p.rating}（${p.reviews}）</span></div><div class="price-stack"><strong class="price price-large">${money.format(p.price)}</strong></div><p class="stock-copy">在庫あり：${p.stock}点</p><div class="button-row"><a class="button button-secondary" href="product.html?id=${encodeURIComponent(p.id)}">商品詳細</a><button class="button button-primary" type="button" data-modal-add="${escapeHTML(p.id)}">カートに追加</button></div></div></div>`,
    );
  }
  function toast(message, type = "default") {
    const node = document.createElement("div");
    node.className = `toast toast-${type}`;
    node.textContent = message;
    qs("#toastRegion")?.append(node);
    setTimeout(() => node.classList.add("is-visible"), 10);
    setTimeout(() => {
      node.classList.remove("is-visible");
      setTimeout(() => node.remove(), 250);
    }, 2600);
  }

  function bindGlobalEvents() {
    document.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-to-cart]");
      if (add) addToCart(add.dataset.addToCart);
      const modalAdd = event.target.closest("[data-modal-add]");
      if (modalAdd) {
        addToCart(modalAdd.dataset.modalAdd);
        closeModal();
      }
      const quick = event.target.closest("[data-quick-view]");
      if (quick) quickView(quick.dataset.quickView);
      const wish = event.target.closest("[data-wishlist]");
      if (wish) toggleWishlist(wish.dataset.wishlist);
      if (
        event.target.closest("[data-modal-close]") ||
        event.target.id === "globalModal"
      )
        closeModal();
      const delivery = event.target.closest("[data-open-delivery]");
      if (delivery)
        openModal(
          "お届け先を設定",
          `<form class="stack-form" id="deliveryForm"><label>郵便番号<input name="postal" inputmode="numeric" placeholder="100-0001" pattern="[0-9]{3}-?[0-9]{4}" required></label><label>都道府県・市区町村<input name="city" value="東京都千代田区" required></label><button class="button button-primary" type="submit">この住所に設定</button></form>`,
        );
    });
    document.addEventListener("submit", (event) => {
      if (event.target.id === "globalSearchForm") {
        event.preventDefault();
        const form = new FormData(event.target);
        const params = new URLSearchParams();
        if (form.get("q")) params.set("q", form.get("q"));
        if (form.get("category")) params.set("category", form.get("category"));
        location.href = `products.html?${params.toString()}`;
      }
      if (event.target.id === "deliveryForm") {
        event.preventDefault();
        closeModal();
        toast("お届け先を設定しました", "success");
      }
    });
    qs("#mobileMenuButton")?.addEventListener("click", (event) => {
      const nav = qs("#primaryNav");
      const open = nav.classList.toggle("is-open");
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
    ensureSharedUI();
    try { const me = await NovaBackend.request('api/auth/me.php'); setUser(me.user); } catch (_) { setUser(null); }
    updateCartBadge();
    renderAuthState();
    renderWishlistState();
    bindGlobalEvents();
  });

  window.Nova = {
    DATA,
    KEYS,
    money,
    escapeHTML,
    qs,
    qsa,
    stars,
    discount,
    deliveryDaysFor,
    shippingFeeFor,
    deliveryLabelFor,
    shippingLabelFor,
    productCard,
    getCart,
    saveCart,
    addToCart,
    setCartQuantity,
    removeFromCart,
    cartDetails,
    cartCount,
    getUser,
    setUser,
    getWishlist,
    toggleWishlist,
    renderWishlistState,
    openModal,
    closeModal,
    toast,
  };
})();
