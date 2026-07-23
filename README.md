# Promptr

Step-by-step prompting checklists for everyday tasks — designed for people with executive functioning challenges.

## Features

- **Preset routines** for showers, dishes, cleaning, teeth, makeup, getting dressed, homework, shopping, and more
- **Lasting custom checklists** saved to your Supabase account (guest mode still uses this device only)
- **Daily plans** — schedule checklists with times for today (or any day)
- **Profile & interface** — display name, timezone, text size, accent color, reduce motion, home layout
- **Reminders** — email from the app owner’s Gmail + events on each user’s Google Calendar
- **Large text** and Apple-inspired controls

## Quick start (frontend)

```bash
npm install
cp .env.example .env
# fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/20260323000000_initial.sql`](supabase/migrations/20260323000000_initial.sql).
3. **Authentication → Providers**
   - Enable Email
   - Enable Google (OAuth client from Google Cloud). Add authorized redirect URI from Supabase.
4. Under Google provider advanced settings, request the Calendar scope:
   `https://www.googleapis.com/auth/calendar.events`
5. Copy Project URL + anon key into `.env`.

## Google Cloud (Calendar + Gmail)

1. Create a Google Cloud project and OAuth consent screen.
2. Create an OAuth **Web** client. Add:
   - Supabase callback URL
   - Your app URL (`VITE_APP_URL`)
3. Enable **Google Calendar API** and **Gmail API**.
4. **Owner Gmail send token** (one-time):
   - Use OAuth Playground or a small script with your client ID/secret
   - Scopes: `https://www.googleapis.com/auth/gmail.send`
   - Save the refresh token — never commit it

## Edge Functions

```bash
# Install Supabase CLI, then:
supabase login
supabase link --project-ref YOUR_REF

supabase secrets set \
  GMAIL_CLIENT_ID=... \
  GMAIL_CLIENT_SECRET=... \
  GMAIL_REFRESH_TOKEN=... \
  GMAIL_FROM="Promptr <you@gmail.com>" \
  GOOGLE_CLIENT_ID=... \
  GOOGLE_CLIENT_SECRET=... \
  CRON_SECRET=some-long-random-string

supabase functions deploy send-reminders
supabase functions deploy upsert-calendar-event
```

Schedule `send-reminders` every 1–5 minutes (Supabase Dashboard → Edge Functions → Schedules, or an external cron) with header:

`x-cron-secret: <CRON_SECRET>`

## Build

```bash
npm run build
npm run preview
```
