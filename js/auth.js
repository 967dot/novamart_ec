document.addEventListener("DOMContentLoaded", () => {
  const { qs, setUser, toast } = window.Nova;

  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({ ok: false, error: "サーバー応答を解析できませんでした。" }));
    if (!response.ok || !data.ok) throw new Error(data.error || "処理に失敗しました。");
    return data;
  };

  const csrf = async () => (await api("api/csrf.php")).csrfToken;

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      button.textContent = input.type === "password" ? "表示" : "非表示";
    });
  });

  const strength = qs("#passwordStrength");
  const registerPassword = qs("#registerPassword");
  registerPassword?.addEventListener("input", () => {
    const value = registerPassword.value;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (strength) {
      strength.querySelectorAll("span").forEach((bar, i) => bar.classList.toggle("is-active", i < score));
      const label = strength.querySelector("small");
      if (label) label.textContent = value.length < 8 ? "8文字以上で入力してください" : `強度 ${score}/4`;
    }
  });

  const showError = (form, message) => {
    const target = form.querySelector(".field-error");
    if (target) target.textContent = message;
    else toast?.(message);
  };

  qs("#registerForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) return form.reportValidity();

    const fd = new FormData(form);
    if (fd.get("password") !== fd.get("confirm")) {
      showError(form, "確認用パスワードが一致しません。");
      return;
    }

    try {
      const token = await csrf();
      const data = await api("api/auth/register.php", {
        method: "POST",
        headers: { "X-CSRF-Token": token },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      sessionStorage.removeItem("novamart_secure_last_order");
      setUser(data.user);
      location.href = "account.html";
    } catch (error) {
      showError(form, error.message);
    }
  });

  qs("#loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) return form.reportValidity();

    const fd = new FormData(form);
    try {
      const token = await csrf();
      const data = await api("api/auth/login.php", {
        method: "POST",
        headers: { "X-CSRF-Token": token },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      sessionStorage.removeItem("novamart_secure_last_order");
      setUser(data.user);
      location.href = "account.html";
    } catch (error) {
      showError(form, error.message);
    }
  });
});
