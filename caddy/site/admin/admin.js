(() => {
  const loginSection = document.querySelector("[data-admin-login]");
  const dashboard = document.querySelector("[data-admin-dashboard]");
  const loginForm = document.querySelector("[data-login-form]");
  let csrf = "";

  const api = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (csrf && options.method && options.method !== "GET") headers["X-CSRF-Token"] = csrf;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(String(response.status));
    return response.json();
  };

  const item = (title, subtitle, body, id, type, unread = false) => {
    const node = document.createElement("article");
    node.className = `admin-item${unread ? " is-unread" : ""}`;
    const strong = document.createElement("strong"); strong.textContent = title;
    const small = document.createElement("small"); small.textContent = subtitle;
    const paragraph = document.createElement("p"); paragraph.textContent = body || "";
    const actions = document.createElement("div"); actions.className = "admin-actions";
    if (unread) { const read = document.createElement("button"); read.textContent = "Oznacz jako przeczytane"; read.dataset.read = id; actions.append(read); }
    const remove = document.createElement("button"); remove.textContent = "Usuń"; remove.dataset.delete = id; remove.dataset.type = type; actions.append(remove);
    node.append(strong, small, paragraph, actions); return node;
  };

  const render = (data) => {
    csrf = data.csrf;
    loginSection.hidden = true;
    dashboard.hidden = false;
    const stats = document.querySelector("[data-admin-stats]");
    const values = [["Odsłony / 30 dni", data.summary.views30d], ["Nieprzeczytane", data.summary.unreadMessages], ["Artykuły", data.summary.posts], ["Projekty", data.summary.projects]];
    stats.replaceChildren(...values.map(([label, value]) => { const node = document.createElement("div"); node.className = "admin-stat"; node.innerHTML = `<strong>${value}</strong><span>${label}</span>`; return node; }));
    const table = document.querySelector("[data-analytics-table]"); table.replaceChildren();
    data.analytics.forEach((row) => { const tr = document.createElement("tr"); [row.day, row.path, row.device, row.views].forEach((value) => { const td = document.createElement("td"); td.textContent = value; tr.append(td); }); table.append(tr); });
    const messages = document.querySelector("[data-messages-list]"); messages.replaceChildren(...data.contacts.map((row) => item(`${row.name} — ${row.subject}`, `${row.email} · ${new Date(row.created_at).toLocaleString("pl-PL")}`, row.message, row.id, "messages", !row.is_read)));
    const posts = document.querySelector("[data-posts-list]"); posts.replaceChildren(...data.posts.map((row) => item(row.title, row.slug, row.summary, row.id, "posts")));
    const projects = document.querySelector("[data-projects-list]"); projects.replaceChildren(...data.projects.map((row) => item(row.title, `${row.category} · ${row.slug}`, row.summary, row.id, "projects")));
  };

  const load = () => api("/api/admin/dashboard").then(render).catch(() => { loginSection.hidden = false; dashboard.hidden = true; });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const notice = document.querySelector("[data-login-notice]");
    notice.textContent = "Logowanie…";
    try {
      await api("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: loginForm.password.value }) });
      loginForm.reset(); await load();
    } catch (error) {
      notice.className = "form-notice error";
      notice.textContent = error.message === "428" ? "Najpierw ustaw hasło lokalnie na serwerze." : error.message === "429" ? "Za dużo prób logowania. Spróbuj ponownie za 15 minut." : "Nieprawidłowe hasło.";
    }
  });

  document.querySelector("[data-logout]").addEventListener("click", async () => { await api("/api/admin/logout", { method: "POST" }); location.reload(); });

  dashboard.addEventListener("click", async (event) => {
    const read = event.target.closest("[data-read]");
    const remove = event.target.closest("[data-delete]");
    try {
      if (read) await api(`/api/admin/messages/${read.dataset.read}/read`, { method: "POST" });
      if (remove && confirm("Na pewno usunąć ten element?")) await api(`/api/admin/${remove.dataset.type}/${remove.dataset.delete}`, { method: "DELETE" });
      if (read || remove) await load();
    } catch { alert("Operacja nie powiodła się."); }
  });

  document.querySelectorAll("[data-content-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const notice = form.querySelector(".form-notice");
      const payload = Object.fromEntries(new FormData(form));
      try {
        await api(`/api/admin/${form.dataset.contentForm}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        form.reset(); notice.className = "form-notice success"; notice.textContent = "Treść została dodana."; await load();
      } catch { notice.className = "form-notice error"; notice.textContent = "Nie udało się dodać treści. Sprawdź pola lub nazwę."; }
    });
  });

  load();
})();
