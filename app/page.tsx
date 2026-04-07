import { Hero } from "@/components/hero";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-5xl px-5 py-10 flex flex-col gap-10">
        <section className="flex flex-col gap-8">
          <Hero />
          <div className="rounded-lg border bg-card p-6 flex flex-col gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Welcome to SESC Events
            </h2>
            <p className="text-sm text-muted-foreground">
              Explore upcoming events, register with your account, and keep
              track of sessions you joined.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/events"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Browse events
              </Link>
              <Link
                href="/my-events"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                My events
              </Link>
            </div>
          </div>
        </section>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://sliitsesc.org/"
              target="_blank"
              className="font-bold hover:underline"
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
