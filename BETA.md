# Uzavřená beta — testování přes odkaz (zdarma)

Bez placeného Apple účtu i bez Google Play. Testeři dostanou **všechno odemčené**
(beta přepínač `EXPO_PUBLIC_BETA_ALL_ACCESS=1`) — nákupy se v betě netestují.

| Platforma | Jak se testeři dostanou k aplikaci | Omezení |
| --- | --- | --- |
| **iOS** | Expo Go z App Storu + odkaz na zveřejněnou verzi (EAS Update) | Tester musí mít bezplatný Expo účet a být pozvaný do organizace. Notifikace a nahrávání fungují, nákupy ne. |
| **Android** | Odkaz ke stažení APK (EAS Build, interní distribuce) | Při instalaci je potřeba povolit „neznámé zdroje“. Plnohodnotná aplikace. |

Nové verze pak stačí zveřejnit jedním příkazem — dostanou je iOS testeři v Expo Go
i Android testeři v nainstalovaném APK (oba kanál `preview`).

## Odkazy

- **iOS (Expo Go):** `exps://u.expo.dev/05647762-26a4-4024-b2cb-b33800d832ca?channel-name=preview`
  (nebo QR kód v [EAS dashboardu](https://expo.dev/accounts/petrprog/projects/speasy/updates) u poslední aktualizace)
- **Android (APK):** odkaz z posledního buildu v [EAS dashboardu](https://expo.dev/accounts/petrprog/projects/speasy/builds)

> Projekt je zatím pod osobním účtem `petrprog`. Aby se mohli přidat testeři,
> převeď ho na expo.dev do organizace Speasy (Project → Settings → Transfer project).
> Po převodu se změní adresy v dashboardu, odkaz `u.expo.dev/…` zůstává stejný.

## Jednorázové nastavení

**Ty (na expo.dev):**
1. Založ bezplatnou **organizaci** (např. `speasy`) — osobní účet nemůže mít členy.
2. Testery přidej jako **Viewer** (Organizace → Members → Invite). Každý tester si
   založí bezplatný Expo účet.

**Já (v projektu):**
```bash
# hotovo: projekt propojený (ID 05647762-…), updates.url nastavené
```

## Vydání nové testovací verze

```bash
# iOS (Expo Go) + Android (APK) — kanál preview
EXPO_PUBLIC_BETA_ALL_ACCESS=1 eas update --channel preview --environment preview --message "Popis změn"

# Android APK (jen když se mění nativní část nebo poprvé)
eas build -p android --profile preview
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
