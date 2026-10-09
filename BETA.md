# Uzavřená beta — testování přes odkaz (zdarma)

Bez placeného Apple účtu i bez Google Play. Testeři dostanou **všechno odemčené**
(beta přepínač `EXPO_PUBLIC_BETA_ALL_ACCESS=1`) — nákupy se v betě netestují.

| Platforma | Jak se testeři dostanou k aplikaci | Omezení |
| --- | --- | --- |
| **iOS** | Expo Go z App Storu + odkaz na zveřejněnou verzi (EAS Update) | Tester musí mít bezplatný Expo účet a být pozvaný do organizace. Notifikace a nahrávání fungují, nákupy ne. |
| **Android** | Odkaz ke stažení APK (EAS Build, interní distribuce) | Při instalaci je potřeba povolit „neznámé zdroje“. Plnohodnotná aplikace. |

Nové verze pak stačí zveřejnit jedním příkazem — dostanou je iOS testeři v Expo Go
i Android testeři v nainstalovaném APK (oba kanál `preview`).

## Jednorázové nastavení

**Ty (na expo.dev):**
1. Založ bezplatnou **organizaci** (např. `speasy`) — osobní účet nemůže mít členy.
2. Testery přidej jako **Viewer** (Organizace → Members → Invite). Každý tester si
   založí bezplatný Expo účet.

**Já (v projektu):**
```bash
npx eas-cli init --id <po založení projektu pod organizací>   # propojí projekt s expo.dev
npx eas-cli update:configure                                 # doplní updates.url do app.json
```

## Vydání nové testovací verze

```bash
# iOS (Expo Go) + Android (APK) — kanál preview
EXPO_PUBLIC_BETA_ALL_ACCESS=1 npx eas-cli update --channel preview --message "Popis změn"

# Android APK (jen když se mění nativní část nebo poprvé)
npx eas-cli build -p android --profile preview
```

## Návod pro testery

**iOS**
1. Nainstaluj **Expo Go** z App Storu a přihlas se svým Expo účtem.
2. Přijmi pozvánku do organizace (přijde e-mailem).
3. Otevři odkaz / naskenuj QR kód, který ti pošleme.

**Android**
1. Otevři odkaz na APK a stáhni ho.
2. Povol instalaci z tohoto zdroje a nainstaluj.

Zpětnou vazbu prosím se screenshotem a popisem, co jsi dělal/a.
