(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let preferredTheme = "light";
  try {
    const savedTheme = localStorage.getItem("serwerbb-theme");
    if (savedTheme === "light" || savedTheme === "dark") preferredTheme = savedTheme;
  } catch { /* An unavailable browser store must not break navigation. */ }
  root.dataset.theme = preferredTheme;

  const header = document.querySelector(".topbar");
  if (header) {
    const themeButton = document.createElement("button");
    themeButton.className = "theme-toggle";
    themeButton.type = "button";
    themeButton.setAttribute("aria-label", preferredTheme === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw");
    themeButton.textContent = preferredTheme === "dark" ? "☀" : "☾";
    const statusNode = header.querySelector(".status");
    if (statusNode) statusNode.before(themeButton);
    else header.append(themeButton);
    themeButton.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("serwerbb-theme", next); } catch { /* Keep the current-page choice. */ }
      themeButton.textContent = next === "dark" ? "☀" : "☾";
      themeButton.setAttribute("aria-label", next === "dark" ? "Włącz jasny motyw" : "Włącz ciemny motyw");
    });
  }

  const nav = header?.querySelector("nav");
  if (nav) {
    nav.id = "primary-navigation";
    header.classList.add("has-mobile-nav");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.textContent = "Menu";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    header.append(toggle);
    const closeMenu = () => {
      header.classList.remove("is-nav-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = !header.classList.contains("is-nav-open");
      header.classList.toggle("is-nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("is-nav-open")) { closeMenu(); toggle.focus(); }
    });
    document.addEventListener("click", (event) => { if (!header.contains(event.target)) closeMenu(); });
    matchMedia("(min-width: 901px)").addEventListener("change", closeMenu);
  }

  const progress = document.createElement("span");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.append(progress);

  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.type = "button";
  backToTop.setAttribute("aria-label", "Wróć na górę strony");
  backToTop.textContent = "↑";
  document.body.append(backToTop);

  let frame = 0;
  const updateScroll = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty("--scroll-progress", max > 0 ? Math.min(1, scrollY / max) : 0);
    backToTop.classList.toggle("is-visible", scrollY > 520);
    header?.classList.toggle("is-scrolled", scrollY > 8);
  };
  addEventListener("scroll", () => {
    if (!frame) frame = requestAnimationFrame(updateScroll);
  }, { passive: true });
  updateScroll();
  backToTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  const status = document.querySelector(".status");
  const serviceStates = document.querySelectorAll("[data-service-status]");
  if (status || serviceStates.length) {
    fetch("/api/status", { cache: "no-store", headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("status");
        return response.json();
      })
      .then((data) => {
        const online = data.status === "online";
        if (status) {
          status.classList.toggle("is-offline", !online);
          const label = status.querySelector(".status-label");
          if (label) label.textContent = online ? "Serwer online" : "Częściowa awaria";
        }
        serviceStates.forEach((element) => {
          const state = data.services?.[element.dataset.serviceStatus] || "unknown";
          element.dataset.state = state;
          element.textContent = state === "online" ? "Działa" : state === "offline" ? "Niedostępna" : "Brak danych";
        });
      })
      .catch(() => {
        if (status) {
          status.classList.add("is-offline");
          const label = status.querySelector(".status-label");
          if (label) label.textContent = "Status niedostępny";
        }
        serviceStates.forEach((element) => {
          element.dataset.state = "unknown";
          element.textContent = "Brak danych";
        });
      });
  }

  const filterButtons = document.querySelectorAll("[data-project-filter]");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.projectFilter;
      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      document.querySelectorAll("[data-project-category]").forEach((card) => {
        const categories = card.dataset.projectCategory.split(" ");
        card.hidden = selected !== "all" && !categories.includes(selected);
      });
    });
  });

  document.querySelectorAll("[data-lightbox]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      const dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.setAttribute("aria-label", trigger.dataset.caption || "Podgląd obrazu");
      const image = document.createElement("img");
      image.src = trigger.getAttribute("href");
      image.alt = trigger.dataset.caption || "";
      const caption = document.createElement("p");
      caption.textContent = trigger.dataset.caption || "";
      const close = document.createElement("button");
      close.type = "button";
      close.setAttribute("aria-label", "Zamknij podgląd");
      close.textContent = "×";
      close.addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (clickEvent) => {
        if (clickEvent.target === dialog) dialog.close();
      });
      dialog.addEventListener("close", () => { dialog.remove(); trigger.focus(); });
      dialog.append(close, image, caption);
      document.body.append(dialog);
      dialog.showModal();
    });
  });

  try {
  if (!location.pathname.startsWith("/admin")) {
    const key = `analytics:${location.hostname}${location.pathname}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      const width = innerWidth;
      const device = width < 680 ? "mobile" : width < 1024 ? "tablet" : "desktop";
      const payload = JSON.stringify({ path: location.pathname, device });
      navigator.sendBeacon?.("/api/analytics", new Blob([payload], { type: "application/json" }));
    }
  }

  } catch { /* Restricted storage must not disable the interface. */ }

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }

})();
