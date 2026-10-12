(() => {
  const list = document.querySelector("[data-blog-list]");
  const article = document.querySelector("[data-blog-article]");
  if (list) {
    fetch("/api/content/posts")
      .then((response) => response.json())
      .then((data) => {
        list.replaceChildren();
        data.posts.forEach((post) => {
          const card = document.createElement("article");
          card.className = "card";
          const date = new Date(post.created_at).toLocaleDateString("pl-PL");
          card.innerHTML = `<div class="card-top"><span>Artykuł</span><span>${date}</span></div>`;
          const title = document.createElement("h2"); title.textContent = post.title;
          const summary = document.createElement("p"); summary.textContent = post.summary;
          const link = document.createElement("a"); link.className = "card-link"; link.href = `/blog/wpis/?slug=${encodeURIComponent(post.slug)}`; link.textContent = "Czytaj →";
          card.append(title, summary, link); list.append(card);
        });
      })
      .catch(() => { list.innerHTML = '<p class="empty-state">Nie udało się pobrać artykułów.</p>'; });
  }
  if (article) {
    const slug = new URLSearchParams(location.search).get("slug") || "";
    fetch(`/api/content/post?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.post) throw new Error("not-found");
        document.title = `${data.post.title} — Hubert`;
        const description = document.querySelector('meta[name="description"]');
        if (description) description.content = data.post.summary;
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
        canonical.href = `${location.origin}/blog/wpis/?slug=${encodeURIComponent(data.post.slug)}`;
        article.querySelector("h1").textContent = data.post.title;
        article.querySelector("[data-article-lead]").textContent = data.post.summary;
        const body = article.querySelector("[data-article-body]");
        body.replaceChildren();
        data.post.body.split(/\n\s*\n/).forEach((paragraph) => { const p = document.createElement("p"); p.textContent = paragraph; body.append(p); });
      })
      .catch(() => { article.innerHTML = '<h1>Nie znaleziono artykułu</h1><p class="lead">Wróć do listy wpisów i wybierz dostępny artykuł.</p>'; });
  }
})();
