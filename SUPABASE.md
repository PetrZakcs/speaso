# Supabase — odpovědi z onboardingu

Aplikace posílá **jen se souhlasem uživatele** (přepínač v onboardingu a v Profilu → Soukromí)
anonymní odpovědi z úvodu: situace, „něco jiného“, cíl, první vlastní scénář, věková skupina,
minuty denně. **Nikdy jméno.** Aplikace smí do tabulky jen zapisovat, číst nemůže nic.

## Jednorázové nastavení (ty)

1. Na [supabase.com](https://supabase.com) založ projekt (free tier, region EU – Frankfurt).
2. **SQL Editor** → vlož a spusť [`supabase/migrations/0001_onboarding_answers.sql`](supabase/migrations/0001_onboarding_answers.sql).
3. **Project Settings → API**: zkopíruj *Project URL* a *anon / publishable key*
   (ne `service_role`!) a pošli mi je — nebo je nastav sám:

```bash
# lokální vývoj: .env (je v .gitignore)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# beta build / EAS Update (prostředí preview)
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://xxxx.supabase.co --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ... --visibility plaintext
```

Bez těchto klíčů aplikace nic neposílá; odpovědi zůstanou „čekající“ a odešlou se při
dalším spuštění verze, která klíče má.

## Vyhodnocení

**Table Editor → `onboarding_answers_latest`** = poslední odpověď z každé instalace.
Nejzajímavější sloupce pro produkt: `situations_other`, `goal_other`, `scenario_title`,
`scenario_phrase`. Export do CSV je v Table Editoru.

## Ochrana údajů

Volné texty o koktání jsou citlivý (zdravotní) údaj → proto výslovný opt-in, výchozí stav
vypnuto. Do `PRIVACY_POLICY.md` je potřeba doplnit: co se posílá, účel (zlepšování aplikace),
příjemce (Supabase, EU), dobu uchování a jak požádat o smazání (podle `install_id`).
