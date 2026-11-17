# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately through GitHub: **Security tab → "Report a vulnerability"**
(private vulnerability reporting) on this repository. Include steps to
reproduce, the affected route or file, and the impact.

We aim to acknowledge reports within 5 working days and will credit reporters
who want to be credited once a fix is released.

## Scope

In scope: authentication and authorization, role escalation (`is_admin`,
`is_volunteer`), ticket and check-in logic, exposure of personal data (NIC,
phone, email), and injection or redirect issues.

Out of scope: findings that need a leaked credential, social engineering,
and denial-of-service by volume.

## For contributors

- Never commit `.env*` files, editor history (`.history/`), keys or tokens.
- Use your own Supabase project for development. Never ask for or share
  production or shared-project credentials.
- Server Actions are public HTTP endpoints. Check authentication and the
  caller's role inside every action and protected page; do not rely on a
  layout or on hidden UI.
- Validate all input on the server (zod) and never trust QR or client payloads.
