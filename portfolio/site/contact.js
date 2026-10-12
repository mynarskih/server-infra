(() => {
  const form = document.querySelector("[data-contact-form]");
  const notice = document.querySelector("[data-form-notice]");
  if (!form || !notice) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    notice.textContent = "Wysyłanie…";
    const values = Object.fromEntries(new FormData(form));
    values.privacy = form.elements.privacy.checked;
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!response.ok) throw new Error(String(response.status));
      form.reset();
      notice.className = "form-notice success";
      notice.textContent = "Wiadomość została zapisana. Dziękuję!";
    } catch (error) {
      notice.className = "form-notice error";
      notice.textContent = error.message === "429" ? "Limit wiadomości został osiągnięty. Spróbuj później." : "Nie udało się wysłać wiadomości. Sprawdź pola i spróbuj ponownie.";
    } finally {
      button.disabled = false;
    }
  });
})();
