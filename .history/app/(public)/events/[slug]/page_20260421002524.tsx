import { notFound } from "next/navigation";
import Image from "next/image";

import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { EventRegistrationSection } from "./EventRegistrationSection";

type Event = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "onsite" | "virtual" | "industry_visit";
  start_at: string;
  end_at: string;
  location: string | null;
  meeting_url: string | null;
  flyer_image_url: string | null;
  color_code: string | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDateRange(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateFormatter = new Intl.DateTimeFormat("en", {
    weekday: "short",
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

export default async function EventDetailPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, type, start_at, end_at, location, meeting_url, flyer_image_url, color_code, status",
    )
    .eq("slug", params.slug)
    .single();

  if (error || !data || data.status !== "published") {
    notFound();
  }

  const event: Event = data;

  let initiallyRegistered = false;
  let hasSecurityData = false;

  if (user) {
    const { data: registration } = await supabase
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .in("status", ["registered", "confirmed", "pending"])
      .maybeSingle();

    initiallyRegistered = Boolean(registration);

    // 2. NEW: Check if they have their security data filled out
    const { data: profile } = await supabase
      .from("profiles")
      .select("nic_number, phone_number")
      .eq("id", user.id)
      .single();

    if (profile?.nic_number && profile?.phone_number) {
      hasSecurityData = true;
    }
  }

  return (
    <main className="min-h-screen w-full flex justify-center">
      <article className="w-full max-w-5xl px-5 py-10 flex flex-col gap-6">
        <header className="rounded-lg border bg-card overflow-hidden">
          <div className="h-1 w-full bg-foreground/70" />
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {event.title}
              </h1>
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
            <p className="text-sm text-muted-foreground">
              {formatDateRange(event.start_at, event.end_at)}
            </p>
            {event.location && (
              <p className="text-sm text-muted-foreground">
                {event.type === "virtual" ? "Online · " : "Onsite · "}
                {event.location}
              </p>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="flex flex-col gap-6">
            {event.flyer_image_url && (
              <div className="overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={event.flyer_image_url}
                  alt={event.title}
                  width={1200}
                  height={700}
                  unoptimized
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="w-full max-h-[520px] object-cover"
                />
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
            <section className="prose prose-sm sm:prose-base dark:prose-invert max-w-none rounded-lg border bg-card p-5">
              <h2>About this event</h2>
              <p>{event.description}</p>
            </section>

            <section className="rounded-lg border bg-card p-5 flex flex-col gap-2">
              <h2 className="font-semibold text-lg">How to join</h2>
              {event.type === "virtual" && event.meeting_url ? (
                <p className="text-sm text-muted-foreground">
                  This is an online event. You can join using this link:{" "}
                  <a
                    href={event.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    {event.meeting_url}
                  </a>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This is an onsite event. Please arrive at the venue a few
                  minutes early so we can start on time.
                </p>
              )}
            </section>

            <section className="rounded-lg border bg-muted/40 p-5 flex flex-col gap-2">
              <h2 className="font-semibold text-lg">Registration</h2>
              <EventRegistrationSection
              eventId={event.id}                  {/* Added this */}
                eventType={event.type}
                slug={event.slug}
                isLoggedIn={Boolean(user)}
                initiallyRegistered={initiallyRegistered}
              />
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
