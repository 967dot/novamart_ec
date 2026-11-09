window.NovaBackend = {
  async request(url, options = {}) {
    const response = await fetch(url, {credentials: 'same-origin', ...options,
      headers: {'Content-Type': 'application/json', ...(options.headers || {})}});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || '通信に失敗しました。');
    return data;
  },
  async post(url, body) {
    const {csrfToken} = await this.request('api/csrf.php');
    return this.request(url, {method: 'POST', headers: {'X-CSRF-Token': csrfToken}, body: JSON.stringify(body)});
  }
};
window.novaReady = (async () => {
  const data = await NovaBackend.request('api/products/search.php');
  window.NOVAMART_DATA.products = data.products;
})();
// Attach immediately so a slow DOM does not cause an unhandled rejection.
window.novaReady.catch(() => {});
