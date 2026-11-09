document.addEventListener("DOMContentLoaded", async () => {
    try { await window.novaReady; } catch (error) {
      if (!document.querySelector('[data-db-error]')) {
        const box = document.createElement('p'); box.dataset.dbError = '';
        box.setAttribute('role', 'alert'); box.textContent = 'DBに接続できません。README.md のセットアップ手順を確認してください。';
        document.querySelector('main')?.prepend(box);
      }
      return;
    }
  const { DATA, productCard, deliveryDaysFor, shippingFeeFor, qs, qsa } =
    window.Nova;

  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get("q") || "",
    category: params.get("category") || "",
    maxPrice: 500000,
    rating: 0,
    deliveryMax: Number(params.get("delivery") || 0),
    shipping: params.get("shipping") || "",
    stockOnly: false,
    sort: params.get("sort") || "recommended",
    page: Math.max(1, parseInt(params.get("page") || "1", 10) || 1),
    perPage: 12,
  };

  qs("#filterKeyword").value = state.q;
  qs("#catalogSort").value = state.sort;

  if (state.category) {
    qsa('[name="categoryFilter"]').forEach((radio) => {
      radio.checked = radio.value === state.category;
    });
  }
  qsa('[name="delivery"]').forEach((radio) => {
    radio.checked = Number(radio.value) === state.deliveryMax;
  });
  qsa('[name="shipping"]').forEach((radio) => {
    radio.checked = radio.value === state.shipping;
  });

  function filtered() {
    const query = state.q.toLowerCase();
    const list = resultRows.filter((product) => {
      if (product.category === "customer") return false;
      const haystack =
        `${product.name} ${product.summary} ${product.categoryLabel} ${product.features.join(" ")}`.toLowerCase();
      const deliveryMatches =
        !state.deliveryMax || deliveryDaysFor(product) <= state.deliveryMax;
      const fee = shippingFeeFor(product);
      const shippingMatches =
        !state.shipping || (state.shipping === "free" ? fee === 0 : fee > 0);

      return (
        
        (!state.category || product.category === state.category) &&
        product.price <= state.maxPrice &&
        product.rating >= state.rating &&
        deliveryMatches &&
        shippingMatches &&
        (!state.stockOnly || product.stock > 0)
      );
    });

    const sorters = {
      recommended: (a, b) =>
        Number(b.featured) - Number(a.featured) || b.rating - a.rating,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      reviews: (a, b) => b.reviews - a.reviews,
      newest: (a, b) => Number(b.newArrival) - Number(a.newArrival),
    };

    return list.sort(sorters[state.sort] || sorters.recommended);
  }

  function syncPrimaryNavigation() {
    qsa("#primaryNav a").forEach((link) => {
      const url = new URL(link.href, location.href);
      const isProductNavigation = url.pathname.endsWith("/products.html");
      if (!isProductNavigation) return;
      const linkCategory = url.searchParams.get("category") || "";
      if (linkCategory === state.category)
        link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function syncURL() {
    const next = new URLSearchParams();
    if (state.q) next.set("q", state.q);
    if (state.category) next.set("category", state.category);
    if (state.deliveryMax) next.set("delivery", String(state.deliveryMax));
    if (state.shipping) next.set("shipping", state.shipping);
    if (state.sort !== "recommended") next.set("sort", state.sort);
    if (state.page > 1) next.set("page", String(state.page));

    const query = next.toString();
    history.replaceState(
      null,
      "",
      query ? `${location.pathname}?${query}` : location.pathname,
    );
  }

  let resultRows = DATA.products;
  let searchSequence = 0;
  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / state.perPage));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * state.perPage;
    const items = list.slice(start, start + state.perPage);

    qs("#resultCount").textContent = `${list.length}件の商品`;
    qs("#productGrid").innerHTML = items.length
      ? items.map(productCard).join("")
      : `<div class="empty-state"><h2>商品が見つかりませんでした</h2><p>検索条件を変更してお試しください。</p><button class="button button-primary" type="button" data-reset-filters>条件をリセット</button></div>`;

    qs("#pagination").innerHTML =
      pages > 1
        ? Array.from(
            { length: pages },
            (_, index) =>
              `<button type="button" data-page="${index + 1}" class="${index + 1 === state.page ? "is-active" : ""}">${index + 1}</button>`,
          ).join("")
        : "";

    const tags = [];
    if (state.q) tags.push(`検索：${state.q}`);
    if (state.category)
      tags.push(
        DATA.categories.find((category) => category.id === state.category)
          ?.name,
      );
    if (state.maxPrice < 500000)
      tags.push(`${state.maxPrice.toLocaleString()}円以下`);
    if (state.rating) tags.push(`評価${state.rating}以上`);
    if (state.deliveryMax)
      tags.push(
        state.deliveryMax === 1 ? "最短翌日" : `${state.deliveryMax}日以内`,
      );
    if (state.shipping)
      tags.push(state.shipping === "free" ? "配送料無料" : "送料あり");
    if (state.stockOnly) tags.push("在庫あり");
    qs("#activeFilters").innerHTML = tags
      .map((tag) => `<span>${window.Nova.escapeHTML(tag)}</span>`)
      .join("");

    syncURL();
    syncPrimaryNavigation();
  }

  async function searchAndRender() {
    const sequence = ++searchSequence;
    qs('#resultCount').textContent = '検索しています…';
    try {
      const response = await NovaBackend.request('api/products/search.php?' + new URLSearchParams({q:state.q,category:state.category,maxPrice:state.maxPrice}));
      if (sequence !== searchSequence) return;
      resultRows = response.products; render();
    } catch(error) {
      if (sequence !== searchSequence) return;
      resultRows = []; qs('#resultCount').textContent = '検索に失敗しました';
      qs('#productGrid').textContent = error.message; qs('#pagination').replaceChildren();
    }
  }
  qs('#filterForm').addEventListener('submit', event => {event.preventDefault(); searchAndRender();});
  function reset() {
    Object.assign(state, {
      q: "",
      category: "",
      maxPrice: 500000,
      rating: 0,
      deliveryMax: 0,
      shipping: "",
      stockOnly: false,
      sort: "recommended",
      page: 1,
    });
    qs("#filterForm").reset();
    qs("#filterKeyword").value = "";
    qs("#catalogSort").value = "recommended";
    qs("#priceValue").textContent = "500,000円";
    searchAndRender();
  }

  qs("#filterForm").addEventListener("input", (event) => {
    const form = new FormData(event.currentTarget);
    state.q = String(form.get("filterKeyword") || "").trim();
    state.category = form.get("categoryFilter") || "";
    state.maxPrice = Number(form.get("maxPrice") || 500000);
    state.rating = Number(form.get("rating") || 0);
    state.deliveryMax = Number(form.get("delivery") || 0);
    state.shipping = form.get("shipping") || "";
    state.stockOnly = form.get("stockOnly") === "on";
    state.page = 1;

    qs("#priceValue").textContent = `${state.maxPrice.toLocaleString()}円`;
    searchAndRender();
  });

  qs("#catalogSort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.page = 1;
    render();
  });

  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      state.page = Number(pageButton.dataset.page);
      render();
      qs(".catalog-main")?.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (event.target.closest("[data-reset-filters]")) reset();
  });

  await searchAndRender();
});
