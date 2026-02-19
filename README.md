# OC Centro Zlín – Soutěžní hra

Webová aplikace pro soutěžní hru v OC Centro Zlín. Hráči skenují QR kódy na stanovištích, odpovídají na otázky a po splnění všech obdrží kód pro vyzvednutí odměny.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **EmailJS** (server-side REST API pro e-maily)
- **qrcode + jszip** (generování QR kódů)

## Lokální spuštění

### 1. Instalace závislostí

```bash
npm install
```

### 2. Supabase setup

1. Vytvořte projekt na [supabase.com](https://supabase.com)
2. V SQL editoru spusťte obsah souboru `supabase/schema.sql`
3. V Authentication → Users vytvořte admin uživatele
4. V SQL editoru vložte admin záznam:

```sql
INSERT INTO admin_users (id, role, display_name)
VALUES ('uid-z-auth', 'superadmin', 'Admin');
```

Pro staff uživatele (pouze ověření kódů):

```sql
INSERT INTO admin_users (id, role, display_name)
VALUES ('uid-z-auth', 'staff', 'Pracovník');
```

### 3. EmailJS setup

1. Registrujte se na [emailjs.com](https://www.emailjs.com)
2. Vytvořte e-mailový service a template
3. Template proměnné: `to_name`, `to_email`, `completion_code`, `game_name`, `reward_description`

### 4. Konfigurace prostředí

Zkopírujte `.env.example` do `.env.local` a vyplňte hodnoty:

```bash
cp .env.example .env.local
```

Hodnoty:
- `NEXT_PUBLIC_SUPABASE_URL` – URL vašeho Supabase projektu
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public klíč
- `SUPABASE_SERVICE_ROLE_KEY` – service role klíč (nikdy neexponovat na klientu!)
- `EMAILJS_SERVICE_ID` – ID emailového service
- `EMAILJS_TEMPLATE_ID` – ID template
- `EMAILJS_PUBLIC_KEY` – veřejný klíč
- `EMAILJS_PRIVATE_KEY` – soukromý klíč
- `NEXT_PUBLIC_APP_URL` – URL aplikace (pro QR kódy)

### 5. Spuštění

```bash
npm run dev
```

Aplikace běží na [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

1. Push do Git repozitáře
2. Importujte v [vercel.com](https://vercel.com)
3. Nastavte environment variables (stejné jako `.env.local`)
4. Deploy

Nezapomeňte aktualizovat `NEXT_PUBLIC_APP_URL` na produkční URL.

## Struktura projektu

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── scan/         # QR skenování
│   │   ├── register/     # Registrace hráče
│   │   ├── answer/       # Odpověď na otázku
│   │   ├── complete/     # Dokončení hry
│   │   ├── verify-code/  # Ověření kódu (staff)
│   │   └── admin/        # Admin CRUD
│   ├── game/[gameId]/    # Hráčské stránky
│   │   ├── scan/[token]/ # QR vstupní bod
│   │   ├── register/     # Registrace
│   │   ├── checkpoint/   # Otázka
│   │   ├── progress/     # Průběh hry
│   │   └── complete/     # Dokončení
│   └── admin/            # Admin stránky
│       ├── login/        # Přihlášení
│       ├── dashboard/    # Přehled her
│       ├── games/        # Správa her
│       └── verify/       # Ověření kódu
├── components/           # Sdílené komponenty
├── lib/                  # Utility knihovny
│   ├── supabase/         # Supabase klienty
│   ├── nanoid.ts         # Generování tokenů
│   ├── email.ts          # EmailJS
│   ├── qr.ts             # QR generování
│   └── types.ts          # TypeScript typy
└── middleware.ts          # Admin auth middleware
supabase/
└── schema.sql            # Databázové schéma
```

## Uživatelské role

| Role | Přístup |
|------|---------|
| **Superadmin** | Plný přístup: správa her, stanovišť, hráčů, ověření kódů |
| **Staff** | Pouze ověření kódů odměn (`/admin/verify`) |

## Flow hráče

1. Naskenuje QR kód na stanovišti
2. Pokud nemá session → registrace (jméno, email, GDPR)
3. Zobrazí se otázka s 3 odpověďmi
4. Po odpovědi → zpětná vazba (správně/špatně)
5. Pokračuje skenováním dalších QR kódů
6. Po splnění všech stanovišť → vygeneruje se unikátní kód
7. Kód odeslán emailem + zobrazen na obrazovce
8. Hráč ukáže kód na info pultu → staff ověří v admin panelu
