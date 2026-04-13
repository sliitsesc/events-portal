import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const valuePoints = [
    "Find and join events in seconds",
    "Get instant ticket confirmation",
    "Track attendance with clean check-in flows",
  ];

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(80%_50%_at_10%_0%,#fef3c7,transparent),radial-gradient(70%_45%_at_90%_20%,#dbeafe,transparent)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 md:gap-14 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border bg-card/95 p-6 shadow-sm md:p-10">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-8 h-32 w-32 rounded-full bg-blue-300/30 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-5">
              <p className="inline-flex w-fit rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                SESC Events Portal
              </p>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Campus Events,
                <br />
                Zero Chaos.
              </h1>

              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Discover events, secure your spot, and show your ticket at
                check-in. Built for students and members joining SESC events.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-md border bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Find Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center rounded-md border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Create Account
                </Link>
              </div>

              <ul className="grid gap-2 pt-1 text-sm text-muted-foreground sm:grid-cols-2">
                {valuePoints.map((point) => (
                  <li key={point} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border bg-background/85 p-4 md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                This Week On Campus
              </p>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-sm font-semibold">UI/UX Design Jam</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fri, 6:00 PM • A503 Auditorium
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-sm font-semibold">AI Builders Meetup</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sat, 10:00 AM • New Building Lab 02
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-3">
                  <p className="text-sm font-semibold">Career Sprint Webinar</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sun, 7:30 PM • Online Session
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="rounded-full border px-3 py-1">
              Trusted in SLIIT student workflows
            </span>
            <span className="rounded-full border px-3 py-1">
              Email-gated authentication
            </span>
            <span className="rounded-full border px-3 py-1">
              Onsite + virtual event support
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Student Journey
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Discover, Register, Attend
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse upcoming events, register with one click, and keep QR-ready
              tickets in one wallet.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/events"
                className="inline-flex items-center rounded-md border bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Browse Events
              </Link>
              <Link
                href="/my-events"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                View My Events
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Event Experience
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Everything You Need On Event Day
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep your ticket code ready, open your QR quickly, and join the
              session without delays.
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/my-events"
                className="inline-flex items-center rounded-md border bg-foreground px-4 py-2 text-sm font-semibold text-background"
              >
                Open My Tickets
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                Join Now
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Simple 3-Step Flow
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm font-semibold">1. Explore Events</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Find upcoming sessions by browsing the latest campus events.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm font-semibold">2. Register Instantly</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Secure your seat and get immediate ticket confirmation.
              </p>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm font-semibold">3. Show Your Ticket</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open your QR ticket from My Events when you arrive.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-foreground px-6 py-7 text-background md:px-8 md:py-9">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Ready To Join The Next Campus Event?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-background/80">
                Register in seconds, save your ticket, and never miss what is
                happening around campus.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center rounded-md border border-background/30 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
              >
                Start Exploring
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-md border border-background/40 px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-background/10"
              >
                Sign In To Register
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
