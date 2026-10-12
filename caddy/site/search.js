(() => {
  const form = document.querySelector("[data-search-form]");
  const input = form?.querySelector("input[type=search]");
  const output = document.querySelector("[data-search-results]");
  if (!form || !input || !output) return;

  const render = (results, query) => {
    output.replaceChildren();
    if (query.length < 2) {
      output.innerHTML = '<p class="empty-state">Wpisz co najmniej dwa znaki.</p>';
      return;
    }
    if (!results.length) {
      output.innerHTML = '<p class="empty-state">Nie znaleziono pasujących treści.</p>';
      return;
    }
    results.forEach((result) => {
      const article = document.createElement("article");
      article.className = "card compact";
      const type = document.createElement("span");
      type.className = "tag";
      type.textContent = result.type;
      const title = document.createElement("h2");
      title.textContent = result.title;
      const description = document.createElement("p");
      description.textContent = result.summary;
      const link = document.createElement("a");
      link.className = "card-link";
      link.href = result.url;
      link.textContent = "Otwórz →";
      article.append(type, title, description, link);
      output.append(article);
    });
  };

  let timer;
  const search = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const query = input.value.trim();
      if (query.length < 2) return render([], query);
      output.innerHTML = '<p class="empty-state">Wyszukiwanie…</p>';
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        render(data.results || [], query);
      } catch {
        output.innerHTML = '<p class="empty-state">Wyszukiwarka jest chwilowo niedostępna.</p>';
      }
    }, 180);
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); search(); });
  input.addEventListener("input", search);
  render([], "");
})();
