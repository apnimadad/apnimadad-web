# Apni Madad Foundation

**Transparent direct-donation platform**: verified needy people receive money straight into their UPI / Bank. Platform takes **₹0 commission**.

## Quick Start

```bash
npm install
cp .env.example .env.local   # add Supabase keys for full backend
npm run dev
```

→ http://localhost:3000

Without Supabase keys the app runs in **demo mode** (UI + compression work, mock data).

## Full Backend Setup

See **[docs/COMPLETE_SETUP.md](docs/COMPLETE_SETUP.md)** for step-by-step:

1. Supabase project
2. SQL schema
3. Storage buckets + policies
4. Admin user
5. Vercel deploy

## Features

| Feature | Status |
|---------|--------|
| English + Hindi | ✅ |
| Auto image compression (~100 KB WebP) | ✅ |
| Auto video compression (ffmpeg.wasm, 720p) | ✅ |
| Case submit / list / detail | ✅ |
| Admin panel (approve, edit, amounts, UPI) | ✅ |
| Direct UPI QR donation | ✅ |
| Progress bars & status | ✅ |
| Filters & search | ✅ |
| Top donors live ticker | ✅ |
| Supabase Auth + DB + Storage | ✅ Ready |

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Compression**: browser-image-compression + ffmpeg.wasm
- **Hosting**: Vercel (free)

## Project Structure

```
src/
  app/           → pages (home, cases, submit, admin, login)
  components/    → Header, Footer, CaseCard, Language, Ticker
  lib/
    actions/     → Server Actions (cases, upload)
    supabase/    → client + server helpers
    compression.ts
    mock-data.ts → demo data when no Supabase
  types/         → TypeScript interfaces
docs/
  schema.sql
  COMPLETE_SETUP.md
```

## License

Built free for NGO / social-good use. Apni Madad Foundation.
