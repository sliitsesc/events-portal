# SESC Events Portal

The SESC Events Portal is a web app for discovering SESC-SLIIT events, registering for them, and managing event-day check-in. Students can view published events and their tickets. Administrators can manage events and registrants, and administrators or volunteers can scan tickets.

## Features

- Public event discovery and event detail pages
- Registration flow with capacity checks
- My Events dashboard with generated QR ticket previews
- Admin panel for creating/editing events
- Admin registrant list with attendance toggling
- QR check-in for admins and volunteers (camera scanner)
- Supabase Auth with server-side session refresh through proxy
- Profile completion flow for non-admin users
- Optional registration confirmation emails via Resend

## Technology

- Next.js App Router, React 19, and TypeScript
- Tailwind CSS and Radix UI components
- Supabase Auth, Postgres, Storage, and Realtime
- `html5-qrcode` for camera scanning and `qrcode` for ticket QR generation
- Resend for registration email

## Requirements

- Node.js and npm (use a current Node.js LTS release).
- A Supabase project configured with the database schema, authentication, Row Level Security (RLS), and storage described below.
- A Resend API key if registration emails should be sent.

## Run locally

This project runs on Next.js.

### Admin Routes

- `/admin/events` event list
- `/admin/events/new` create event
- `/admin/events/[id]/edit` edit event
- `/admin/events/[id]/registrants` registrant management + attendance toggle
- `/admin/events/[id]/scan` QR check-in page
- `/admin/audit-logs` audit trail

   ```bash
   npm install
   ```

- Supabase Auth session is refreshed in proxy middleware.
- Non-authenticated users are redirected from protected routes to `/auth/login`.
- Google login is open to any account (domain restriction was removed in `9886e58`).
- Non-admin users without a profile `student_id` are redirected to `/complete-profile`.
- Admin routes validate `profiles.is_admin` before rendering.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The camera scanner requires a secure browser context: use `localhost` locally or HTTPS in a deployed environment, and allow camera access.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by browser and server clients. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key used by Auth and database clients. |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for elevated profile reads | Server-side fallback for reading profiles when RLS prevents an admin-wide profile query. The code also recognizes `SUPABASE_SERVICE_KEY` and `SUPABASE_SECRET_KEY`. Keep these keys server-only; never prefix them with `NEXT_PUBLIC_`. |
| `RESEND_API_KEY` | For email delivery | API key used by the registration confirmation email sender. Email delivery failures are logged and do not undo a successful registration. |
| `RESEND_FROM_EMAIL` | No | Sender identity for registration email. Defaults to `SESC Events <events@events.sliitsesc.org>`. Configure a sender/domain that Resend has verified. |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL used to construct event links in emails. If unset, the app uses `VERCEL_URL` when available, otherwise `https://events.sliitsesc.org`. |
| `VERCEL_URL` | Deployment-provided | Used as a fallback base URL when `NEXT_PUBLIC_SITE_URL` is unset. |

The `.env` and `.env*.local` files are ignored by Git. Do not commit credentials.

## Routes

### Public and signed-in student pages

| Path | Description |
| --- | --- |
| `/` | Home page and up to three upcoming published events. |
| `/events` | Published events catalogue, including a separate industry visit section. |
| `/events/[slug]` | Published event details and registration. Industry visits also collect NIC and phone details. |
| `/my-events` | Signed-in user's registrations and QR tickets. |
| `/complete-profile` | Collects required student profile details when they are missing. |
| `/auth/login`, `/auth/sign-up` | Sign-in and account creation. |
| `/auth/forgot-password`, `/auth/update-password` | Password recovery and update. |
| `/auth/callback`, `/auth/confirm` | Supabase OAuth and email confirmation handlers. |

### Admin pages

| Path | Description |
| --- | --- |
| `/admin/events` | Event list and management entry point. |
| `/admin/events/new` | Create an event. |
| `/admin/events/[id]/edit` | Edit an event. |
| `/admin/events/[id]/registrants` | Registrants, attendance, live attendance updates, and CSV export. Industry visit manifests include NIC and phone columns. |
| `/admin/events/[id]/scan` | QR scanner for onsite events. |
| `/admin/audit-logs` | Recent audit activity. |

### Volunteer page

| Path | Description |
| --- | --- |
| `/volunteer` | Volunteer-only dashboard listing today's published onsite events. The linked volunteer scan route is currently missing. |

## Authentication and roles

- Supabase sessions are refreshed by the root `proxy.ts` handler. Protected pages redirect signed-out users to `/auth/login`.
- Auth callback and email confirmation handlers ensure a corresponding `profiles` row exists.
- A signed-in non-admin without a `student_id` is sent to `/complete-profile`. Admin users bypass student profile completion.
- Admin routes and sensitive admin server actions check `profiles.is_admin`.
- The volunteer dashboard layout and scan server action allow `profiles.is_volunteer` or `profiles.is_admin`. However, the volunteer dashboard links to `/volunteer/events/[id]/scan`, which is not implemented; `/admin/events/[id]/scan` exists and is protected by the admin layout.
- The OAuth callback does not implement the `@my.sliit.lk` email-domain restriction claimed in an older version of this README. Configure allowed sign-in domains in Supabase if that restriction is required.

## Supabase setup

This repository does not contain a complete initial database schema or a migration runner. The two SQL files under `supabase/sql/` are incremental changes and assume the relevant tables, enum, and base policies already exist. Review and apply them in order in the Supabase SQL editor (or your own migration workflow):

1. `2026-04-15-profiles-admin-read-policy.sql` adds `public.is_current_user_admin()` and allows authenticated admins to read all profile rows while users can read their own row. This supports showing profile data in the admin registrants list.
2. `2026-04-20-add-industry-visit-event-type.sql` adds `industry_visit` to the existing `event_type` enum.

The application reads and writes the following database objects. Use the source queries as the definitive reference when matching column names and types.

### `profiles`

The app uses `id` (matching `auth.users.id`), `email`, `full_name`, `student_id`, `is_admin`, `is_volunteer`, `nic_number`, and `phone_number`. Some fields are optional depending on the account and event type. The profile completion and registration flows upsert a user's profile; industry visit registration requires NIC and phone data.

### `events`

The app uses `id`, `slug`, `title`, `description`, `type`, `location`, `meeting_url`, `start_at`, `end_at`, `capacity`, `status`, `flyer_image_url`, `color_code`, and `created_by`. Event types are `onsite`, `virtual`, and `industry_visit`. The admin form supports draft and published states and event management also uses archived status. Use a database `event_type` enum compatible with the included enum change, or adapt the application and migration together.

### `event_registrations`

The app uses `id`, `event_id`, `user_id`, `status`, `attended`, and `created_at`. Registration code uses the `registered` status; some pages also recognize `confirmed` and `pending`. A unique constraint on `(event_id, user_id)` is recommended and duplicate handling recognizes PostgreSQL error `23505`.

### `audit_logs`

The app inserts and reads `admin_id`, `action_description`, and `created_at`. The action description is a JSON-encoded string that includes the action, target, details, and available request metadata. The admin audit page shows the latest 100 records.

### Storage and RLS

- Create a public `event-flyers` Supabase Storage bucket for event flyer images. Set upload and read policies to match your admin and public access requirements. Public image URLs are configured as allowed remote images in `next.config.ts`.
- Enable RLS and define policies that allow public reads of published events; authorized admins to manage events; signed-in users to manage their own profiles and registrations; and admins/volunteers to perform their respective check-in operations.
- Admin registrant pages need access to registration rows and profile fields for all registrants. Apply the included profile admin-read policy, or configure the `SUPABASE_SERVICE_ROLE_KEY` server-side fallback where appropriate.
- The registrant table subscribes to Supabase Realtime updates on `event_registrations`. Enable the relevant Realtime publication and ensure the client's RLS policy permits the intended subscribers to receive updates.
- Audit-log access should be limited to admins. The audit writer itself checks the current user’s `is_admin` flag.

The SQL included here does not create these tables, storage bucket, authentication providers, or the complete RLS policy set. Configure those before using the app.

## Project scripts

```bash
npm run dev     # Start the development server
npm run build   # Create a production build
npm run start   # Serve the production build
npm run lint    # Run ESLint
```

## Source layout

```text
app/
  (public)/       Event catalogue, event detail, and registration
  (user)/         Student pages, including My Events
  (admin)/        Admin event, registrant, scanner, and audit pages
  (volunteer)/    Volunteer scanner page
  actions/        Server action for ticket check-in
  auth/           Sign-in, sign-up, recovery, and callback routes
  utils/          Audit logging helper
components/       Shared UI, forms, navigation, and QR scanner
lib/supabase/     Browser, server, proxy, and optional admin clients
lib/              Ticket QR, email, and UI utilities
supabase/sql/     Incremental SQL changes (not a full schema)
```

4. Open http://localhost:3000

## Scripts

- `npm run dev` start dev server
- `npm run build` production build
- `npm run start` run built app
- `npm run lint` run ESLint

## Current Limitations / Next Work

- Database schema is documented here but only partly versioned in `supabase/sql/`. Apply the files there in date order.
- Feature work is tracked as GitHub issues #20-#29. See `CONTRIBUTING.md` and `docs/CONTRIBUTIONS.md`.

## Project Structure (High Level)

- Ticket QR payloads contain a version, registration ID, event ID, user ID, and issue timestamp. Check-in validates the event and registration, requires a `registered` status, and rejects tickets already marked attended.
- The QR scanner uses the device's environment-facing camera where available. Browsers require HTTPS or `localhost` for camera access.
- Capacity is checked against registrations with `registered` status before insert. Database constraints and RLS remain important for protecting data and handling concurrent registrations.
- Admin event and attendance changes are recorded through the audit helper, which requires an admin profile. Scan handling also calls this helper for scan outcomes, so verify audit table permissions and role behavior when enabling volunteer scanning.
- The volunteer dashboard links to a scan route that is not implemented, so volunteers cannot currently reach the scanner through that page.
- The project currently has no test script in `package.json`.

## License

No license file is currently included in this repository.
