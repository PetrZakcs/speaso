# Speasy — Deploy checklist

## 1. RevenueCat nastavení (5 min)
1. Jdi na https://app.revenuecat.com → tvůj projekt → API Keys
2. Zkopíruj **Public SDK key** (začíná `appl_...`)
3. Vytvoř soubor `.env` v kořeni projektu (je v `.gitignore`) a klíče nastav i jako
   EAS environment variables pro produkční build:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_TVUJ_KLIC_ZDE
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_TVUJ_KLIC_ZDE
   ```
   Bez klíče běží vývojový build na RevenueCat Test Store klíči; produkční build
   bez klíče nákupy vypne (paywall ukáže „Nákupy nejsou dostupné“).
4. Produkty vytvoř v App Store Connect / Google Play (měsíční + roční předplatné,
   volitelně free trial jako introductory offer) a v RevenueCat nastav:
   - **Entitlement** s identifikátorem `premium` (aplikace ho kontroluje v `lib/purchases.ts`)
   - **Offering** označený jako *current* s balíčky **Monthly** a **Annual**
   Ceny, trial i měna se v aplikaci berou přímo z obchodu — v kódu nejsou natvrdo.
5. Zveřejni `PRIVACY_POLICY.md` na veřejné URL a vlož ji do `lib/links.ts` (`PRIVACY_URL`).

## 2. EAS login
```bash
npx eas-cli login    # přihlásíš se svým Expo účtem
```

## 3. Testování na fyzickém iPhone (BEZ Apple Dev účtu)
```bash
npx expo start
# Otevři Expo Go na iPhonu → naskenuj QR
```

## 4. Jakmile máš Apple Developer Account (~24h po registraci)

### Vytvoř app v App Store Connect
1. https://appstoreconnect.apple.com → My Apps → + → New App
2. Bundle ID: `com.speasy.app`
3. SKU: `speasy-ios`
4. Doplň `ascAppId` a `appleTeamId` do `eas.json`

### EAS Build (cloud, ~20 min)
```bash
npx eas-cli build -p ios --profile production
```

### Upload do App Store Connect
```bash
npx eas-cli submit -p ios --latest
```

## 5. App Store Connect — vyplnit před review
- [ ] Screenshoty (6,5" iPhone + 5,5") — lze z Expo Go
- [ ] Privacy Policy URL (nasaď PRIVACY_POLICY.md na GitHub Pages nebo Notion)
- [ ] Popis aplikace (CZ + EN)
- [ ] Klíčová slova: koktání, řeč, logoped, speaking, stuttering, fluency
- [ ] Kategorie: Health & Fitness nebo Education
- [ ] Age rating: 4+ (bez násilí, bez 18+ obsahu)
- [ ] Subscription disclosure (povinné: cena, perioda, trial, auto-renewal)

## 6. Privacy Policy hosting (2 min)
Nejrychlejší: vytvoř veřejnou Notion stránku z PRIVACY_POLICY.md
nebo GitHub Pages z README. URL zadej do App Store Connect.
