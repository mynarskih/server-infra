# Historia zmian

## 0.1.0 — przygotowanie pierwszego wydania, 2026-10-12

- Zapis aktualnego kodu i zasobów projektu: Współdzielona infrastruktura serwera: Caddy, DDNS Cloudflare, strony Nginx oraz wspólne zasoby branding/studio. Strona, portfolio i Caddy współdzielą pliki przez względne ścieżki, dlatego zachowano je w jednym repozytorium.
- Dodanie reguł wykluczania sekretów, danych, zależności i wyników buildów.
- Dokumentacja uruchomienia, konfiguracji, kontroli i ograniczeń.
- Workflow CI z minimalnymi uprawnieniami i lokalnym skanowaniem Gitleaks.
- 32 testy stron i wspólnych zasobów PASS. Nie restartowano infrastruktury produkcyjnej. Obrazy systemowe i moduł Caddy wymagają osobnego audytu CVE.

Wydanie przygotowywane jako prerelease. Nie tworzono historii wcześniejszych wydań. Istniejące numery w package.json pozostają zachowane. Szczegóły poprawionych zależności i wykonanych kontroli: KONTROLE.md. GitHub Release jeszcze nie utworzony.

### Końcowa kontrola przygotowanej kopii

32/32 testy PASS; Compose Caddy/strona/portfolio PASS.

Brak zależności npm/Python spoza biblioteki standardowej w źródłach tego projektu. Sprawdzono lokalne obrazy przez Trivy; wynik obrazu nie jest wynikiem npm audit.

