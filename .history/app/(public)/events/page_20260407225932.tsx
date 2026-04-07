import Link from "next/link";
import { Suspense } from "react";

import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  slug: string;
  title: string;
  type: "onsite" | "virtual";
  start_at: string;
  end_at: string;
  color_code: string | null;
  flyer_image_url: string | null;
  location: string | null;
};

async function getPublishedEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, type, start_at, end_at, color_code, flyer_image_url, location",
    )
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (error) {
    console.error("Error fetching events", error);
    return [];
  }

  return data ?? [];
}

function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatter = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (sameDay) {
    return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }

  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

async function EventsList() {
  const events = await getPublishedEvents();

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No events have been published yet. Please check back soon.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {events.map((event) => {
        const accentColor =
          event.color_code && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(event.color_code)
            ? event.color_code
            : "#4f46e5";

        return (
          <li key={event.id}>
            <Link
              href={`/events/${event.slug}`}
              className="group block overflow-hidden rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div
                className="h-1 w-full"
                style={{ backgroundColor: accentColor }}
              />
              {event.flyer_image_url && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={event.flyer_image_url}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold line-clamp-2">
                    {event.title}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                      event.type === "virtual"
                        ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
                    )}
                  >
                    {event.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(event.start_at, event.end_at)}
                </p>
                {event.location && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {event.type === "virtual" ? "Online · " : "Onsite · "}
                    {event.location}
                  </p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function EventsPage() {
  return (
    <main className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-5xl px-5 py-10 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">SESC Events</h1>
          <p className="text-sm text-muted-foreground">
            Discover events for our student community. Click on an event to see
            full details and share the page with friends.
          </p>
        </header>

        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Loading events...</p>
          }
        >
          <EventsList />
        </Suspense>
      </div>
    </main>
  );
}

