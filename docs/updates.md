# Ažuriranja — OTA i obavezno ažuriranje

Dva mehanizma, oba ugrađena od prve verzije. Moraju da budu u **prvoj** verziji koja izađe:
aplikacija bez njih ne može kasnije da ih dobije, osim novom instalacijom iz prodavnice.

|             | OTA (EAS Update)                                        | Obavezno ažuriranje                                                       |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Šta radi    | nova JS verzija stiže na telefon bez prodavnice         | stara verzija prikazuje samo „Potrebno je ažuriranje" sa linkom           |
| Kada        | ispravka greške, tekst, izgled — sve što nije native    | promena API-ja koja lomi stare aplikacije, povučeno loše izdanje          |
| Ko odlučuje | developer, komandom                                     | backend, vrednošću u `.env`                                               |
| Bez naloga  | isključeno — aplikacija radi JS sa kojim je napravljena | radi potpuno (naš backend), link ka prodavnici tek kad aplikacija postoji |

---

## OTA — EAS Update (treba Expo nalog)

Release build (`preview`, `production`) pri pokretanju pita Expo servere za novu JS verziju svog
**kanala** i preuzme je u pozadini; primenjuje se pri **sledećem** pokretanju. Za proveru: ugasi
aplikaciju skroz, otvori, sačekaj par sekundi, ugasi i otvori ponovo — do dva hladna pokretanja.

Dev build ne prima OTA na ovaj način — on JS ionako uzima od Metro-a.

### Šta je već podešeno

- `expo-updates` je u aplikaciji;
- **kanal po varijanti** u `eas.json`: `preview` build sluša kanal `preview`, `production` kanal
  `production` — update za testere nikad ne stiže korisnicima;
- **runtime verzija = `version` iz `app.json`** — update stiže samo na build-ove iste verzije
  (vidi „Native promene" ispod);
- URL za update-ove se pravi iz `EAS_PROJECT_ID`; bez njega su update-ovi isključeni;
- Sentry greške nose tag `expo-update-id` / `expo-is-embedded-update`, pa se vidi da li je greška
  iz build-a ili iz update-a.

### Jednom po projektu

Ništa posebno: dovoljni su koraci iz `docs/builds.md` (Expo nalog, `eas init`, `EAS_PROJECT_ID`,
`EXPO_PUBLIC_API_URL` po EAS okruženju). Build napravljen posle toga već prima update-ove.

### Slanje update-a

```sh
npm run update:preview -- --message "Ispravka filtera korisnika"
# testeri provere (do dva hladna pokretanja), pa isto za korisnike:
npm run update:production -- --message "Ispravka filtera korisnika"
```

Skripte postavljaju `APP_VARIANT`, kanal i EAS okruženje. Ne pokreći `eas update` ručno bez njih:
bez `APP_VARIANT` update nosi podešavanja produkcijske varijante, a bez `--environment` API adresu
iz tvog `.env.local` (tj. `localhost`).

**Proveri pre prvog update-a** da `EXPO_PUBLIC_API_URL` postoji u EAS okruženjima `preview` i
`production` (`npx eas-cli@latest env:list --environment production`). Ako ne postoji, update
uzima vrednost iz `.env.local` i aplikacija na telefonima počne da gađa tvoj računar.

Posle update-a, ako projekat ima Sentry, otpremi source map-e (inače su stack trace-ovi iz update-a
nečitljivi) — `SENTRY_ORG`, `SENTRY_PROJECT` i `SENTRY_AUTH_TOKEN` treba da budu u shell-u:

```sh
npm run sentry:sourcemaps
```

Povlačenje lošeg update-a: `npx eas-cli@latest update:rollback` (ili na expo.dev → Updates).

### Native promene — kad OTA ne sme

OTA menja samo JS i slike. **Novi native paket** (`npx expo install` paketa sa native kodom),
promena plugin-a u `app.json`, permisija, ikonice ili nadogradnja Expo SDK-a traže **novi build**.

Pravilo: **uz svaku native promenu podigni `version` u `app.json`** (npr. `1.2.0` → `1.3.0`). Time
build dobija novu runtime verziju, a update-ovi napravljeni posle toga stižu samo na njega — stari
build-ovi ostaju na svom JS-u i ne dobijaju kod koji traži native deo koji nemaju. Zaboravljeno
podizanje verzije znači da update sa novim JS-om može da stigne u stari build i da se sruši
(`expo-updates` posle pada pokušava da se vrati na prethodnu verziju, ali korisnik je pad već video).

Ako nisi siguran da li je promena native: `npx expo install --check` i `git diff app.json` — sve
što menja `package.json` zavisnosti sa native kodom ili `app.json` jeste.

---

## Obavezno ažuriranje (bez naloga)

Aplikacija pri svakom pokretanju i povratku u prvi plan pita backend
`GET /mobile/app-version/internal/{ios|android}`, pre prijave (`internal` je ova aplikacija;
eksterna aplikacija za kupce ima svoj minimum pod `external`). Ako je instalirana verzija starija od
`minimum_version`, prikazuje **samo** ekran „Potrebno je ažuriranje" sa dugmetom ka prodavnici —
ni prijava ni ostatak aplikacije nisu dostupni.

Ako backend ne odgovori (nema mreže, server pao), aplikacija radi normalno — nedostupan server ne
sme nikog da zaključa. Isto važi za vrednost koja nije verzija (npr. greška u kucanju).

### Podešavanje — u `.env` backend-a

```sh
MOBILE_INTERNAL_IOS_MINIMUM_VERSION=1.3.0
MOBILE_INTERNAL_ANDROID_MINIMUM_VERSION=1.3.0
MOBILE_INTERNAL_IOS_STORE_URL=https://apps.apple.com/app/id1234567890
MOBILE_INTERNAL_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.firma.backoffice
```

Prazno = nema minimuma. Bez linka ka prodavnici ekran kaže „Obratite se administratoru".
Opis je u `config/mobile.php` backend-a. Svaka varijanta gađa svoj backend, pa staging i
produkcija imaju svoj minimum.

**Minimum diži tek kad je nova verzija već dostupna u toj prodavnici** (Apple review ume da traje
danima). Inače aplikacija šalje ljude na ažuriranje koje još ne mogu da dobiju.

Poredi se `version` iz `app.json` (ono što korisnik vidi u prodavnici), deo po deo: `1.10.0` je
novije od `1.9.0`. Build broj se ne gleda.

**OTA ne pomaže ovde:** update ne menja `version`, pa aplikacija sa novim JS-om i dalje ima istu
verziju. Obavezno ažuriranje je za slučaj kad je potreban novi build iz prodavnice.

---

## Šta traži nalog

| Šta                                     | Treba                                                             |
| --------------------------------------- | ----------------------------------------------------------------- |
| obavezno ažuriranje (ekran, provera)    | ništa — naš backend                                               |
| dugme „Ažuriraj" ka prodavnici          | aplikacija objavljena u App Store-u / Google Play-u (link)        |
| OTA update-ovi                          | Expo nalog (`docs/builds.md`) i build napravljen posle `eas init` |
| čitljive greške iz update-a u Sentry-ju | Sentry (`docs/sentry.md`) + `npm run sentry:sourcemaps`           |
