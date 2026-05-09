# PHOTIZO Network International

Production-ready first version of the PHOTIZO ministry website and admin dashboard, built with Next.js, TypeScript, Tailwind CSS, Supabase, React Hook Form, and Zod.

## What’s Included

- Premium public website for evangelism, teachings, programs, biblical questions, contact, and salvation follow-up
- Guided salvation journey: `/salvation`, `/salvation/prayer`, `/salvation/welcome`
- Dynamic programs pages with per-program registration routes
- Supabase-backed public submission endpoints
- Protected admin dashboard with program CMS, ministry records, and settings
- Supabase Auth-based admin sign-in
- Route protection with Next.js proxy
- Supabase storage upload support for program flyers

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Supabase
- React Hook Form
- Zod

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
ADMIN_EMAIL=
```

You can use either the new Supabase key names or the legacy ones:

- Preferred new public key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Preferred new server key: `SUPABASE_SECRET_KEY`
- Legacy public key still supported: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Legacy server key still supported: `SUPABASE_SERVICE_ROLE_KEY`

If your Supabase dashboard shows `publishable key`, use that for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
If your dashboard shows `anon key`, use that for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
If your dashboard shows `secret key`, use that for `SUPABASE_SECRET_KEY`.
If your dashboard shows `service_role`, use that for `SUPABASE_SERVICE_ROLE_KEY`.

4. Apply the SQL in [supabase/schema.sql](/C:/Users/ojoad/OneDrive/Desktop/Photizo%20Ministries%20Int/supabase/schema.sql).

5. In Supabase Auth, create the admin user account you want to use for login.

6. Insert that admin email into `public.admin_users`, or set the same value in `ADMIN_EMAIL`.

7. Run the app:

```bash
npm run dev
```

8. Open:

- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`

## Main Routes

- `/`
- `/about`
- `/teachings`
- `/programs`
- `/programs/[slug]`
- `/ask-a-question`
- `/contact`
- `/salvation`
- `/salvation/prayer`
- `/salvation/welcome`
- `/admin/login`
- `/admin/dashboard`
- `/admin/programs`
- `/admin/registrations`
- `/admin/salvation-responses`
- `/admin/questions`
- `/admin/contact-messages`
- `/admin/settings`

## Important Setup Notes

- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is used only on the server for secure inserts, admin mutations, and flyer uploads.
- Never expose the service role key in client components.
- Public forms write through server routes, so visitors do not need direct database access.
- Admin routes are protected in both the proxy layer and the server-side admin check.
- The SQL file includes RLS policies and a public storage bucket for program flyers.

## Verification

Production build check:

```bash
npm run build
```
