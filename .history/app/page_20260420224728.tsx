import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";

type WeekEvent = {
  id: string;
  slug: string;
  title: string;
  start_at: string;
  type: "onsite" | "virtual" ;
  location: string | null;
  flyer_image_url: string | null;
};

function formatWeekEventDate(startIso: string) {
  const date = new Date(startIso);

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, slug, title, start_at, type, location, flyer_image_url")
    .eq("status", "published")
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(3);

  const weekEvents = (data ?? []) as WeekEvent[];

  const valuePoints = [
    "Join coding workshops, hackathons, and tech talks",
    "Get instant registration and ticket confirmation",
    "Keep your QR ticket ready for smooth check-in",
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
                SESC Software Engineering Community
              </p>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Software Engineering Events,
                <br />
                One Student Hub.
              </h1>

              <p className="max-w-xl text-base text-muted-foreground md:text-lg">
                Discover SESC workshops, coding sessions, career talks, and
                community meetups. Register fast and keep your ticket ready.
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
                This Week In SESC
              </p>
              {weekEvents.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No upcoming events this week yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {weekEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      className="block overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/30"
                    >
                      {event.flyer_image_url ? (
                        <div className="h-28 w-full overflow-hidden bg-muted">
                          <Image
                            src={event.flyer_image_url}
                            alt={event.title}
                            width={640}
                            height={160}
                            className="h-full w-full object-cover object-top"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                      <div className="p-3">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatWeekEventDate(event.start_at)} •{" "}
                          {event.type === "virtual"
                            ? "Online"
                            : event.location || "Onsite"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span className="rounded-full border px-3 py-1">
              Built for Software Engineering students
            </span>
            <span className="rounded-full border px-3 py-1">
              @my.sliit.lk verified sign-in
            </span>
            <span className="rounded-full border px-3 py-1">
              Workshops, hackathons, and tech talks
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
              Browse upcoming SE community events, register in one click, and
              keep QR-ready tickets in one wallet.
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
              Keep your ticket code ready, open your QR quickly, and join your
              workshop or session without delays.
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
                Find upcoming SESC coding, design, and career events.
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
                Ready For The Next SESC Tech Event?
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-background/80">
                Register in seconds, save your ticket, and stay connected with
                the Software Engineering student community.
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

        <SiteFooter />
      </div>
    </main>
  );
}
