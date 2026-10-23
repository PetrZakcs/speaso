# Speaso — Administrátorská a logopedická příručka

Tento návod shrnuje správu aplikace Speaso: databázi, analytiku, předplatná a propojení s logopedy.

---

## 1. Supabase Backend (Databáze, Analytika a CMS)

Pro ukládání anonymních odpovědí z onboardingu, produktové analytiky a spolupráci s logopedy využívá Speaso **Supabase (EU Frankfurt)**.

### Jak zprovoznit Supabase:
1. Zaregistruj se na [supabase.com](https://supabase.com) a vytvoř nový projekt (zvol region **Central EU / Frankfurt** kvůli GDPR).
2. Otevři **SQL Editor** v levém menu Supabase.
3. Zkopíruj a spusť skript [`supabase_schema.sql`](file:///Users/petrzak/Desktop/speasy/supabase_schema.sql).
4. V **Project Settings → API** zkopíruj:
   * **Project URL**
   * **anon public API key**
5. Přidej tyto klíče do svého lokálního souboru `.env` a do EAS Secrets:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tvuj-anon-klic
   ```

### Co spravuješ v Supabase Studio:
* **`onboarding_answers`:** Přehled odpovědí uživatelů (jaké situace lidi nejvíc trápí, jaké mají cíle).
* **`analytics_events`:** Sledování průchodu onboardingem (`onboarding_start`, `paywall_view`, `exercise_start`).
* **`therapist_patients`:** Databáze propojených pacientů podle kódů `SPE-XXXX`.
* **`cms_content`:** Možnost přidávat nové citáty a texty ke čtení přímo z webu bez nutnosti vydávat novou verzi aplikace na App Store.

---

## 2. Příručka pro logopedy (Klinická spolupráce)

### Jak funguje propojení pacienta a logopeda:
1. **Pacient v aplikaci Speaso:**
   * Otevře záložku **Profil** → sekce **Spolupráce s logopedem**.
   * Klepne na **„Propojit s ordinací“**.
   * Aplikace mu vygeneruje unikátní kód pacienta (např. `SPE-8492`).
   * Pacient může kód rovnou poslat logopedovi klepnutím na *„Odeslat kód logopedovi“* nebo si zapsat jméno svého terapeuta.

2. **Logoped v ordinaci:**
   * Získá od pacienta kód `SPE-8492`.
   * V tabulce `therapist_patients` (nebo v budoucím webovém portálu) přiřadí kód k pacientovi.
   * Pacient může na každé návštěvě vygenerovat **kompletní 30denní PDF zprávu** (grafy mluvení, vliv spánku a vody, odcvičené minuty, nácviky situací a osobní deník) klepnutím na *„Sdílet zprávu s logopedem (PDF)“*.

---

## 3. RevenueCat & Správa předplatného

Všechny platby a nákupy běží přes **RevenueCat**:
* **Dashboard (app.revenuecat.com):**
  * Přehled MRR (měsíčních tržeb), aktivních předplatitelů a míry konverze.
  * Zákaznická podpora: možnost vyhledat uživatele podle `install_id` a ručně mu udělit předplatné.
* **Promo kódy v aplikaci:**
  * V kódu [`lib/promocodes.ts`](file:///Users/petrzak/Desktop/speasy/lib/promocodes.ts) jsou přednastavené vouchery (`SPEASOVIP`, `BETA2026`, `LOGOPED`, `FREEMONTH`, `SPEASO30`).
  * Uživatelé je mohou zadat v Profilu nebo na Paywallu.

---

## 4. Výzkumná databáze balbuties (Klinický výzkum)

Speaso anonymně shromažďuje longitudinální data pro výzkum koktavosti do tabulky `research_balbuties_data`:
* **Sledované parametry:** Hodnocení mluvení (1–5), délka spánku, vypité sklenice vody, počasí, věková skupina, přítomnost deníkové reflexe a frekvence krizových situací.
* **Ochrana soukromí:** Žádná jména, žádný volný text deníku ani nahrávky do výzkumné tabulky nejdou — data jsou zcela anonymizovaná a splňují etické standardy pro klinické studie.
* **Export pro lékaře/pacienta:** Uživatel si může svá data kdykoli stáhnout v JSON formátu přímo z karty Pokrok.

---

## 5. Virální růst & Sociální sítě

V záložce **Pokrok** má uživatel tlačítko **„Sdílet můj pokrok“**:
* Generuje moderní kartu pro Instagram Stories / WhatsApp / TikTok s logem Speaso, počtem dní v řadě (Streak) a odkazem na `speaso.app`.
* Každý uživatel se tak stává organickým ambasadorem aplikace.

---

## 6. Chytré notifikace & Časové preference (`user_notification_schedules`)

Aplikace Speaso odesílá anonymizovaná telemetrická data o preferovaných časech notifikací uživatelů:

* **Sledované sloty:**
  * **Denní trénink (`practice`):** Čas cvičení plynulosti mluvy.
  * **Ranní naladění (`morning`):** Ranní zápis spánku a mluvy.
  * **Záchrana série (`streak_saver`):** Večerní urgence před přerušením série.
* **Časové zóny:** Zaznamenáváme přesné IANA časové pásmo (např. `Europe/Prague`, `America/New_York`) a posun od UTC (`utc_offset_hours`).

### Praktické SQL dotazy pro cron nebo marketingové kampaně:

```sql
-- 1. Zjisti špičky: v kolik hodin lidé nejčastěji trénují
SELECT practice_hour, count(*) as pocet_uzivatelu
FROM public.user_notification_schedules
WHERE practice_enabled = true
GROUP BY practice_hour
ORDER BY pocet_uzivatelu DESC;

-- 2. Vyber uživatele pro odeslání push notifikace v jejich lokálním čase (např. aktuální hodina)
SELECT install_id, language, practice_hour, timezone
FROM public.user_notification_schedules
WHERE practice_enabled = true
  AND practice_hour = EXTRACT(HOUR FROM (now() AT TIME ZONE timezone));
```

---

## 7. Správa VIP Promo kódů a ochrana proti zneužití (`vip_promo_codes`)

Kódy už **nemusíš** vkládat do kódu aplikace ani vydávat novou verzi. Vše řídíš z **Supabase Table Editoru** nebo přes **SQL Editor**.

### Kde kódy spravuješ:
V administraci Supabase (`supabase.com`) otevři **Table Editor** a tabulku `vip_promo_codes`:
* **`code`:** Samotný kód (velkými písmeny, např. `VIP-LUCIE-2026`, `LOGOPED-BRNO`).
* **`description`:** Popis pro tebe (např. *„1 rok zdarma pro Mgr. Lucii Novákovou“*).
* **`duration_days`:** Délka platnosti po zadání:
  * `NULL` = **Doživotní VIP** (pro tebe, investory, zakladatele).
  * `365` = **1 rok** (pro spolupracující logopedy).
  * `30` = **30 dní** (pro influencery, soutěže).
* **`max_redemptions`:** **Klíčová ochrana proti úniku kódu!**
  * `1` = **Jednorázový kód:** Jakmile kód obdarovaný zadá, kód se stane neaktivní. I kdyby ho vyfotil na Instagram nebo poslal kamarádům, nikdo jiný ho už nemůže použít (aplikace napíše *„Tento kód již dosáhl maximálního počtu použití“*).
  * `50` = Balíček např. pro účastníky odborné konference.
  * `NULL` = Neomezený počet použití (veřejná kampaň).
* **`valid_until`:** Časový limit pro aktivaci (např. *„platí do konce roku“*).
* **`is_active`:** Přepínač `true` / `false`. Pokud by kód náhodou unikl na internet, jedním kliknutím ho přepneš na `false` a kód okamžitě přestane fungovat pro všechny!

---

### Hotové SQL šablony pro rychlé vytvoření kódů:

#### 1. Vytvoření 1 jednorázového VIP kódu pro konkrétního logopeda (ochrana proti úniku):
```sql
INSERT INTO public.vip_promo_codes (code, description, duration_days, max_redemptions)
VALUES ('VIP-LOGOPED-NOVAKOVA', '1 rok zdarma pro Mgr. Novákovou', 365, 1);
```

#### 2. Vytvoření doživotního VIP pro partnera / ambasadora:
```sql
INSERT INTO public.vip_promo_codes (code, description, duration_days, max_redemptions)
VALUES ('VIP-PARTNER-KAREL', 'Doživotní VIP pro partnera projektu', NULL, 1);
```

#### 3. Hromadné vygenerování 10 unikátních jednorázových kódů (např. pro kliniku):
```sql
INSERT INTO public.vip_promo_codes (code, description, duration_days, max_redemptions)
SELECT 
  'SPEASO-' || upper(substr(md5(random()::text), 1, 6)),
  'Klinika logo balíček - jednorázový kód na 6 měsíců',
  180,
  1
FROM generate_series(1, 10);
```

#### 4. Kontrola: Kdo a kdy jaký kód uplatnil:
```sql
SELECT 
  r.code,
  c.description,
  r.install_id,
  r.redeemed_at,
  c.times_redeemed,
  c.max_redemptions
FROM public.vip_promo_redemptions r
JOIN public.vip_promo_codes c ON c.code = r.code
ORDER BY r.redeemed_at DESC;
```

---

## 8. Administrátorský Panel přímo v mobilní aplikaci

Aplikace Speaso obsahuje plnohodnotný vestavěný admin panel s živým napojením na Supabase, telemetrií a exportem dat.

### Jak se do administrace dostaneš:
1. **Skrytý přístup v Profilu:** V záložce **Profil** klepni **7× rychle za sebou na řádek „Verze 1.0.0“**.
2. **Přes Deep Link:** V mobilním Safari nebo terminálu otevři odkaz `speaso://admin`.

### Zabezpečení (Gatekeeper):
* Běžní uživatelé v aplikaci nevidí žádné tlačítko ani odkaz na administraci.
* Pro vstup je vyžadován e-mail a heslo správce (ověřováno přes Supabase Auth).
* Nového administrátora můžeš kdykoli přidat v Supabase v záložce **Authentication → Users**.

### Co v administraci najdeš:
* **Živý přehled (KPI):** Počet vyplněných dotazníků, výzkumných záznamů, analytických eventů, notifikačních rozvrhů, VIP kódů a propojených logopedů.
* **Filtrování a detail záznamu:** Okamžité vyhledávání a zobrazení celého JSON záznamu.
* **1-klikový CSV export pro Excel:** Každá tabulka má tlačítko `[ 📥 Exportovat CSV ]` s podporou českého kódování UTF-8 BOM a středníkových oddělovačů.



