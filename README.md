
## Przygotowanie prywatnego repozytorium — 2026-10-12

Współdzielona infrastruktura serwera: Caddy, DDNS Cloudflare, strony Nginx oraz wspólne zasoby branding/studio. Strona, portfolio i Caddy współdzielą pliki przez względne ścieżki, dlatego zachowano je w jednym repozytorium.

Źródło bieżącego wdrożenia: `C:\Users\hmpow\Documents\Codex\2026-09-23\chc-skonfigurowa-m-j-domowy-serwer\server-infra`. Ten katalog jest oddzielną kopią przygotowaną do wersjonowania; działające kontenery nadal używają oryginału. Nie przeniesiono baz danych ani wolumenów. Nie dodano licencji open source.

### Wymagania i instalacja

Windows/PowerShell, Git, Docker Desktop z kontenerami Linux i Compose obsługującym `!override` (2.24.4 lub nowszy). Aplikacje JS wymagają Node.js 22.13+; projekty z pnpm używają pnpm 11.19.0. Backend wymaga Python 3.13 przy uruchomieniu poza Dockerem. Klonuj dopiero po utworzeniu potwierdzonego prywatnego repozytorium.

### Konfiguracja, uruchomienie i testy

```powershell
node --test tests/*.test.mjs
# Każdy moduł ma własny compose.yaml; konfiguracja jest związana z domowym serwerem.
docker compose -f portfolio/compose.yaml config --quiet
docker compose -f strona/compose.yaml config --quiet
docker compose -f caddy/compose.yaml config --quiet
# DDNS: przygotuj lokalny ddns/secrets/cloudflare_api_token.txt, nie dodawaj go do Git.
# Uruchamiaj moduły dopiero po dostosowaniu domen i zewnętrznych sieci.
# Caddy zawiera integrację z Nextcloud; Nextcloud nie jest projektem do publikacji.
```

Wartości `.env.example` są szablonem, nie konfiguracją produkcyjną. Wypełnij lokalny `.env` niezależnymi losowymi sekretami; nie zastępuj działających kluczy bez planu rotacji. Porty i sieci produkcyjne są zajęte: używaj osobnego projektu Compose i wolnych portów. Temp Mail w wariancie domowym współdzieli bramę; pełne odizolowanie wymaga dodatkowej konfiguracji sieci i routingu. Nie wykonuj `down -v` na produkcji.

### Faktyczny stan kontroli i ograniczenia

32 testy stron i wspólnych zasobów PASS. Nie restartowano infrastruktury produkcyjnej. Obrazy systemowe i moduł Caddy wymagają osobnego audytu CVE.

Wyniki końcowe i audyt po poprawkach opisuje `KONTROLE.md`. Workflow ma uprawnienie `contents: read`, brak sekretów, przypięte Actions i osobny skan Gitleaks przed instalacją zależności. Obecność workflow nie oznacza, że CI na GitHub zostało uruchomione. Zabezpieczenia konta, prywatność zdalnego repo i zgodność SHA wymagają sprawdzenia po wysłaniu. Pierwsze wydanie 0.1.0 należy oznaczyć jako prerelease.
