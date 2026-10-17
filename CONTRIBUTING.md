# Contributing

Welcome to the SESC Events Portal. This guide is for volunteers working on the
training issues.

## Getting started

1. Pick an open issue and comment "I'll take this". Wait for it to be assigned
   to you. One active issue per volunteer at a time.
2. Fork or clone the repo, then branch from `develop`:
   `git checkout develop && git pull && git checkout -b feat/<issue-number>-short-name`
3. Copy the env variables from the README into `.env.local` (ask the
   Development Head for the shared dev Supabase project). Never commit `.env*`.
4. `npm ci` then `npm run dev`.

## Before you open a PR

All of these must pass; CI runs the same checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Pull requests

- Target `develop`. Never push to `develop` or `main` directly.
- Put `Closes #<issue number>` in the description. A check fails without it.
- Fill in the PR template, including how you tested it. Add screenshots for UI.
- Keep the change to what the issue asks. Do not reformat unrelated files.
- Do not add dependencies unless the issue allows it.
- Expect to explain your code in review. Changes will be requested; that is
  normal and counts in your favour when you respond well.

## Database changes

Never change the schema from the Supabase dashboard alone. Add a dated SQL file
under `supabase/sql/` and mention it in your PR. Only the Development Head
applies migrations to shared projects.

## How contributions are tracked

Merged PRs are scored in `docs/CONTRIBUTIONS.md`. Work that is copied,
unexplained, or touches unrelated files will not count.

## Branches and releases

| Branch | Purpose |
|---|---|
| `develop` | Integration. All PRs land here after CI and review. |
| `main` | Production. Merging here triggers the deploy workflow. |
