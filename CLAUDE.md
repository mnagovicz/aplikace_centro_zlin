# OC Centro Zlín – Soutěžní hra

## Komunikace
- Mluv česky

## Tech Stack
- Next.js 14 (App Router, TypeScript, src/ adresář)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- EmailJS (server-side REST API, musí se await-ovat)
- jsQR + getUserMedia (QR skener v prohlížeči)
- qrcode + jszip (generování QR kódů)
- nanoid v3 pro tokeny

## Supabase
- URL: https://sgnfcdzfgwztxlvuvkdb.supabase.co
- Admin UUID: a1bfd921-15d1-474e-b482-f9a1e2e5c0ff (superadmin)
- Tabulky: games, checkpoints, players, player_checkpoints, admin_users
- Sloupec `players.redeemed_at` – jednorázové vydání odměny
- Middleware používá service role key pro admin check (bypass RLS)

## Deploy
- Repo: https://github.com/mnagovicz/aplikace_centro_zlin
- Live: https://aplikace-centro-zlin.vercel.app
- Vercel – automatický deploy z GitHub main branch
- Env vars na Vercelu: Supabase (URL, anon key, service role key) + EmailJS (service ID, template ID, public key, private key)

## Branding
- Logo: public/logo.jpg (růžové pozadí #E8637A)
- Logo je na hlavní stránce, admin loginu a admin navigaci

## Funkce
- Hráčský flow: QR sken → registrace → otázky → kód odměny + email
- Admin: správa her (CRUD, klonování), stanovišť, hráčů (tabulka + CSV export)
- Staff: ověření kódu odměny + jednorázové vydání (redeemed_at)
- QR skener přímo v aplikaci (jsQR + nativní kamera)

## Důležité
- Po změnách vždy `npm run build` pro ověření
- Po úspěšném buildu pushni na GitHub (Vercel redeployne automaticky)
- Admin stránky mají `force-dynamic` layout (bez env vars neprojdou prerender)
- QR ZIP endpoint vrací `new Uint8Array(buffer)` (ne raw Buffer)
- EmailJS volání musí být `await` (Vercel jinak ukončí funkci předčasně)
- EmailJS potřebuje Origin header: "https://aplikace-centro-zlin.vercel.app"
