import Link from "next/link";
import { CalendarDays, QrCode, ShieldCheck, Users } from "lucide-react";

export default function Home() {
  const highlights = [
    {
      icon: CalendarDays,
      title: "Publish Events Faster",
      text: "Create onsite or virtual events, upload flyers, and publish in minutes.",
    },
    {
      icon: Users,
      title: "Registration At Scale",
      text: "Track sign-ups with capacity limits, registration status, and attendee lists.",
    },
    {
      icon: QrCode,
      title: "Digital Student Tickets",
      text: "Each registration generates a QR ticket preview for streamlined check-in.",
    },
    {
      icon: ShieldCheck,
      title: "Role-based Access",
      text: "Admin and student flows are protected through Supabase auth and profile checks.",
    },
  ];

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(70%_50%_at_20%_0%,hsl(var(--muted)),transparent),radial-gradient(50%_35%_at_85%_15%,hsl(var(--accent)),transparent)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-12 md:gap-16 md:py-16">
        <section className="relative overflow-hidden rounded-2xl border bg-card/90 p-6 shadow-sm backdrop-blur md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-foreground/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-12 h-44 w-44 rounded-full bg-foreground/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col gap-5">
              <p className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                SESC-SLIIT University Platform
              </p>

              <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Run Every Campus Event From One Place.
              </h1>

              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                From planning and publishing to registrations and attendance,
                SESC Events keeps organizers and students aligned through one
                secure workflow.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/events"
                  className="inline-flex items-center rounded-md border bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Explore Events
                </Link>
                <Link
                  href="/my-events"
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  My Tickets
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Create account
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Event Types
                </p>
                <p className="mt-2 text-2xl font-bold">Onsite + Virtual</p>
              </div>
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Access
                </p>
                <p className="mt-2 text-2xl font-bold">Student + Admin</p>
              </div>
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Check-in
                </p>
                <p className="mt-2 text-2xl font-bold">QR Tickets</p>
              </div>
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Identity
                </p>
                <p className="mt-2 text-2xl font-bold">SLIIT Email Gate</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Built For Real Student Operations
            </h2>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Platform Highlights
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <li
                  key={item.title}
                  className="rounded-xl border bg-card p-5 transition-colors hover:bg-accent/30"
                >
                  <div className="mb-3 inline-flex rounded-md border bg-background p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            How It Works
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Step 1
              </p>
              <h3 className="mt-2 text-lg font-semibold">Publish</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Admins create event details, assign capacity, and publish to the
                student feed.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Step 2
              </p>
              <h3 className="mt-2 text-lg font-semibold">Register</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Students sign in, register instantly, and keep their ticket in
                My Events.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Step 3
              </p>
              <h3 className="mt-2 text-lg font-semibold">Track Attendance</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Organizers review registrants, mark attendance, and use QR
                check-in flows.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-foreground px-6 py-7 text-background md:px-8 md:py-9">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Ready For The Next SESC Event Drop?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-background/80">
                Browse upcoming sessions, secure your seat early, and keep all
                your event tickets in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center rounded-md border border-background/30 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
              >
                View Upcoming Events
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-md border border-background/40 px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-background/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <footer className="mx-auto w-full border-t py-10 text-center text-xs text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://sliitsesc.org/"
              target="_blank"
              className="font-semibold text-foreground underline-offset-4 hover:underline"
              rel="noreferrer noopener"
            >
              SESC-SLIIT
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
