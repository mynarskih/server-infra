(() => {
  const grid = document.querySelector(".project-grid");
  if (!grid) return;
  fetch("/api/content/projects")
    .then((response) => response.json())
    .then((data) => {
      const existing = new Set([...grid.querySelectorAll("[data-project-slug]")].map((card) => card.dataset.projectSlug));
      data.projects.filter((project) => !existing.has(project.slug)).forEach((project) => {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.projectCategory = project.category;
        card.dataset.projectSlug = project.slug;
        const top = document.createElement("div"); top.className = "card-top";
        const category = document.createElement("span"); category.textContent = project.category;
        const fresh = document.createElement("span"); fresh.textContent = "Nowy";
        top.append(category, fresh);
        const title = document.createElement("h3"); title.textContent = project.title;
        const summary = document.createElement("p"); summary.textContent = project.summary;
        const link = document.createElement("a"); link.className = "card-link"; link.href = project.url || "#"; link.textContent = "Otwórz projekt →";
        card.append(top, title, summary, link); grid.append(card);
      });
    })
    .catch(() => {});
})();
