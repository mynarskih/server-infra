/* Progressive enhancement: content is never hidden by CSS or JavaScript. */
(() => {
  const init = () => {
    const main = document.querySelector("main");
    if (!main || !("IntersectionObserver" in window) || !("animate" in HTMLElement.prototype)) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const selector = ".section-head, .card, .service-item, .step, .flow-item, .gallery-grid > a, .about, .callout, .project-preview, .contact-form";
    const seen = new WeakSet();
    const active = new Map();
    let observer;

    const reveal = (element) => {
      if (seen.has(element)) return;
      seen.add(element);
      observer.unobserve(element);
      element.dataset.scrollReveal = "done";
      if (preference.matches || document.hidden || element.matches(":focus-within")) return;
      const siblings = [...element.parentElement.children].filter(child => child.matches(selector));
      const delay = Math.min(Math.max(0, siblings.indexOf(element)), 2) * 70;
      try {
        const animation = element.animate([
          { opacity: 0.18, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" }
        ], { duration: 560, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
        active.set(element, animation);
        const release = () => active.delete(element);
        animation.addEventListener("finish", release, { once: true });
        animation.addEventListener("cancel", release, { once: true });
      } catch { /* Unsupported animation must never affect access to the content. */ }
    };

    const observe = (element) => {
      if (seen.has(element) || preference.matches) return;
      // Already visible or above the viewport: do not flash on first load/back navigation.
      const rect = element.getBoundingClientRect();
      if (rect.height > 0 && rect.top < innerHeight - 12) {
        seen.add(element);
        element.dataset.scrollReveal = "static";
        return;
      }
      element.dataset.scrollReveal = "pending";
      observer.observe(element);
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(selector)) observe(node);
      node.querySelectorAll(selector).forEach(observe);
    };
    const start = () => {
      if (preference.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) reveal(entry.target);
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -12px 0px" });
      scan(main);
    };
    start();
    // Blog, search and project cards may arrive after the initial render.
    const changes = new MutationObserver(records => {
      if (!observer || preference.matches) return;
      records.forEach(record => record.addedNodes.forEach(scan));
    });
    changes.observe(main, { childList: true, subtree: true });
    main.addEventListener("focusin", event => {
      for (const [element, animation] of active) {
        if (element.contains(event.target)) animation.cancel();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) active.forEach(animation => animation.cancel());
    });
    preference.addEventListener("change", () => {
      observer?.disconnect();
      active.forEach(animation => animation.cancel());
      if (!preference.matches) start();
    });
    addEventListener("pagehide", () => {
      observer?.disconnect();
      changes.disconnect();
      active.forEach(animation => animation.cancel());
    });
    addEventListener("pageshow", event => {
      if (event.persisted) {
        start();
        changes.observe(main, { childList: true, subtree: true });
      }
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
