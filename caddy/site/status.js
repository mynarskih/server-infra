(() => {
  const output = document.querySelector("[data-status-history]");
  if (!output) return;
  const names = { website: "Strona główna", portfolio: "Portfolio", files: "Chmura" };

  fetch("/api/status/history?hours=24", { cache: "no-store" })
    .then((response) => response.json())
    .then((data) => {
      output.replaceChildren();
      Object.entries(names).forEach(([service, label]) => {
        const samples = (data.samples || []).filter((item) => item.service === service).slice(-96);
        const online = samples.filter((item) => item.status === "online").length;
        const uptime = samples.length ? (online / samples.length * 100).toFixed(1) : "—";
        const average = online ? Math.round(samples.filter((item) => item.latency_ms > 0).reduce((sum, item) => sum + item.latency_ms, 0) / online) : 0;
        const card = document.createElement("article");
        card.className = "status-card";
        const heading = document.createElement("div");
        heading.className = "status-card-head";
        heading.innerHTML = `<div><strong>${label}</strong><small>${uptime}% dostępności · ${average || "—"} ms</small></div><span>${samples.at(-1)?.status === "online" ? "Działa" : "Brak danych"}</span>`;
        const strip = document.createElement("div");
        strip.className = "history-strip";
        strip.setAttribute("aria-label", `Historia usługi ${label}`);
        samples.forEach((sample) => {
          const bar = document.createElement("i");
          bar.dataset.state = sample.status;
          bar.title = `${new Date(sample.checked_at).toLocaleString("pl-PL")} · ${sample.status}`;
          strip.append(bar);
        });
        card.append(heading, strip);
        output.append(card);
      });
    })
    .catch(() => { output.innerHTML = '<p class="empty-state">Historia jest chwilowo niedostępna.</p>'; });
})();
