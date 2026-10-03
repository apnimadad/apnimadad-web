# Apni Madad Foundation - Complete Setup Guide

## 1. Prerequisites

- Node.js 18+ (https://nodejs.org)
- Git
- Free Supabase account (https://supabase.com)

## 2. Project Setup

```bash
# Extract the zip
unzip apni-madad-foundation.zip
cd apni-madad

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

## 3. Create Supabase Project

1. Go to https://supabase.com → New Project
2. Choose region (Mumbai / Singapore recommended for India)
3. Set a strong database password
4. Wait for project to be ready (~2 min)

## 4. Run Database Schema

1. In Supabase Dashboard → **SQL Editor** → New query
2. Copy entire content of `docs/schema.sql`
3. Run it
4. Confirm tables: `profiles`, `cases`, `donations`, `audit_logs`

## 5. Create Storage Buckets

In Supabase → **Storage** → New bucket:

| Bucket Name   | Public | Purpose                    |
|---------------|--------|----------------------------|
| case-photos   | Yes    | Patient photos             |
| case-videos   | Yes    | Patient videos             |
| case-docs     | No     | Medical documents (private)|

### Storage Policies (SQL Editor)

```sql
-- Public read for photos & videos
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'case-photos');

CREATE POLICY "Public read videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'case-videos');

-- Authenticated users can upload
CREATE POLICY "Auth upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'case-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'case-videos' AND auth.role() = 'authenticated');

CREATE POLICY "Auth upload docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'case-docs' AND auth.role() = 'authenticated');

-- Admins can read private docs
CREATE POLICY "Admin read docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'case-docs' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

## 6. Environment Variables

In `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # Project Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...      # Project Settings → API → service_role (secret!)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Never commit** `.env.local` or service_role key to Git.

## 7. Create First Admin User

1. Start app: `npm run dev`
2. Go to `/login` → Register with your email
3. In Supabase → Authentication → Users → copy the user UUID
4. SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-USER-UUID';
-- If profile row doesn't exist yet:
INSERT INTO profiles (id, role, full_name)
VALUES ('YOUR-USER-UUID', 'admin', 'Admin Name')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## 8. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

- **Demo mode**: Without `.env.local` keys → UI + compression work, data is mock
- **Full mode**: With keys → real DB + Storage + Auth

## 9. Deploy to Vercel (Free)

1. Push code to GitHub
2. https://vercel.com → Import project
3. Add same environment variables in Vercel dashboard
4. Deploy
5. Add custom domain (optional)

## 10. Features Checklist

- [x] Bilingual EN / HI
- [x] Case submission with auto image (~100KB) + video compression
- [x] Direct UPI/Bank donation (no platform commission)
- [x] Admin approve / reject / edit
- [x] Progress bar + status
- [x] Filters & search
- [x] Top donors ticker
- [x] Document storage (private)
- [x] Role-based access ready

## 11. Optional Improvements

- Resend / Supabase email for notifications
- Razorpay payment links (still direct to beneficiary)
- Activity log UI
- WhatsApp notification via API

## Support

After launch: train admin, hand over source code + this document.
