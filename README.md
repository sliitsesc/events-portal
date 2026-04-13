# SESC Events Portal

SESC Events Portal is a Next.js + Supabase web app for publishing student events, managing registrations, and handling attendance workflows for SESC-SLIIT.

## What This Project Includes

- Public event discovery and event detail pages
- Registration flow with capacity checks
- My Events dashboard with generated QR ticket previews
- Admin panel for creating/editing events
- Admin registrant list with attendance toggling
- Admin QR check-in page route (scanner UI placeholder currently)
- Supabase Auth with server-side session refresh through proxy
- Profile completion flow for non-admin users
- Optional registration confirmation emails via Resend

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui primitives
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- QR generation via `qrcode`
- Transactional email via `resend`

## App Routes

### Public/User Routes

- `/` home page
- `/events` published events listing
- `/events/[slug]` event details + registration
- `/my-events` registered events + ticket QR preview
- `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/update-password`
- `/complete-profile` required for non-admin users without `student_id`

### Admin Routes

- `/admin/events` event list
- `/admin/events/new` create event
- `/admin/events/[id]/edit` edit event
- `/admin/events/[id]/registrants` registrant management + attendance toggle
- `/admin/events/[id]/scan` QR check-in page (placeholder)

## Authentication And Access Rules

- Supabase Auth session is refreshed in proxy middleware.
- Non-authenticated users are redirected from protected routes to `/auth/login`.
- OAuth callback currently allows only emails ending with `@my.sliit.lk`.
- Non-admin users without a profile `student_id` are redirected to `/complete-profile`.
- Admin routes validate `profiles.is_admin` before rendering.

## Environment Variables

Create a `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY

# Optional fallback for legacy code paths
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional: for links inside transactional emails
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: enable registration email sending
RESEND_API_KEY=YOUR_RESEND_API_KEY
RESEND_FROM_EMAIL="SESC Events <events@events.sliitsesc.org>"
```

Notes:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the primary key variable used by this project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is only kept as compatibility fallback in some files.

## Supabase Requirements

This repository currently does not include migration files. Ensure your Supabase project has these resources.

### Tables

#### `profiles`

Suggested columns:

- `id` uuid primary key references `auth.users(id)`
- `email` text
- `full_name` text
- `student_id` text
- `is_admin` boolean default false

Useful constraints:

- unique(`student_id`) for non-null values

#### `events`

Suggested columns:

- `id` uuid primary key
- `slug` text unique
- `title` text
- `description` text
- `type` text (`onsite` or `virtual`)
- `location` text nullable
- `meeting_url` text nullable
- `start_at` timestamptz
- `end_at` timestamptz
- `capacity` integer nullable
- `status` text (`draft`, `published`, `archived`)
- `flyer_image_url` text nullable
- `color_code` text nullable
- `created_by` uuid nullable references `auth.users(id)`

#### `event_registrations`

Suggested columns:

- `id` uuid primary key
- `event_id` uuid references `events(id)`
- `user_id` uuid references `auth.users(id)`
- `status` text (uses `registered` in current code)
- `attended` boolean default false
- `created_at` timestamptz default now()

Useful constraints:

- unique(`event_id`, `user_id`) to prevent duplicate registrations

#### `audit_logs` (optional, utility exists)

Suggested columns:

- `id` uuid primary key
- `admin_id` uuid references `auth.users(id)`
- `action_description` text
- `created_at` timestamptz default now()

### Storage Bucket

- Bucket name: `event-flyers`
- Used for event flyer uploads from the admin event form
- Must allow uploads and public URL access according to your policy model

### RLS Recommendations

Apply Row Level Security policies appropriate for your org. At minimum:

- `profiles`: users can read/update their own row; admins may read broader data if needed
- `events`: public can read `published`; admins can create/update/delete
- `event_registrations`: users can create/read their own registrations; admins can read all and update attendance
- `audit_logs`: insert/read limited to admins

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Add `.env.local` values (see above).

3. Run development server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Scripts

- `npm run dev` start dev server
- `npm run build` production build
- `npm run start` run built app
- `npm run lint` run ESLint

## Current Limitations / Next Work

- Admin QR scanner page exists, but camera/scanner logic is not implemented yet.
- Database schema is documented here but not versioned as SQL migrations in the repo.
- Audit logs utility exists, but no dedicated admin UI page is currently wired.

## Project Structure (High Level)

- `app/(public)` public event browsing and registration
- `app/(user)` user-specific views like My Events
- `app/(admin)` admin dashboard and management workflows
- `app/auth` auth pages and callback route
- `lib/supabase` browser/server/proxy Supabase clients
- `lib/email.ts` registration email sender (Resend)
- `lib/tickets.ts` ticket payload and QR generation

## Acknowledgements

Built for SESC-SLIIT event operations and student engagement workflows.
