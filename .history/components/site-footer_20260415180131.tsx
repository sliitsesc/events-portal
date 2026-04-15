import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden rounded-2xl border bg-card/95 px-6 py-7 md:px-8 md:py-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 left-6 h-20 w-20 rounded-full bg-blue-300/20 blur-2xl" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex w-fit rounded-full border bg-background/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            SESC-SLIIT
          </p>
          <p className="text-sm font-semibold text-foreground">
            Software Engineering Students Community
          </p>
          <p className="text-xs text-muted-foreground">
            Empowering student events, workshops, and tech culture on campus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground md:justify-end">
          <Link
            href="/events"
            className="rounded-md border px-3 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-foreground"
          >
            Events
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border px-3 py-1.5 font-semibold transition-colors hover:bg-accent hover:text-foreground"
          >
            Sign In
          </Link>
          <a
            href="https://sliitsesc.org/"
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md border px-3 py-1.5 font-semibold text-foreground transition-colors hover:bg-accent"
          >
            sliitsesc.org
          </a>
        </div>
      </div>

      <div className="relative mt-6 border-t pt-4 text-center text-xs text-muted-foreground md:text-left">
        <p>© {currentYear} SESC-SLIIT. All rights reserved.</p>
      </div>
    </footer>
  );
}
