# Production authentication email templates

The hosted Supabase project uses dashboard-managed templates. Copy these bodies into **Authentication → Email Templates** after confirming the matching application routes are deployed:

- Confirm signup: `confirmation.html`
- Password recovery: `recovery.html`

The member client supplies `redirectTo` as `/auth/callback?next=...`. Each template appends the one-time `token_hash` and the correct email type. The callback verifies token hashes with Supabase SSR and writes the returned session to the response cookies before redirecting to a safe local destination. The same callback retains PKCE code exchange for OAuth and legacy confirmation links.

Add this exact production redirect pattern in **Authentication → URL Configuration → Redirect URLs**:

`https://photizonetwork.com/auth/callback`

Keep the Site URL at `https://photizonetwork.com`. Do not disable email confirmation. Do not use these templates until the matching route is deployed.
