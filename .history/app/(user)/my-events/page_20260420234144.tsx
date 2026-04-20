import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { buildTicketQrDataUrl, getTicketCode } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { QrTicketPreview } from "./QrTicketPreview";

type Row = {
  id: string;
  created_at: string;
  event_id: string;
  user_id: string;
  events: {
    id: string;
    slug: string;
    title: string;
    type: "onsite" | "virtual" | "industry_visit";
    start_at: string;
    end_at: string;
    location: string | null;
    color_code: string | null;
  } | null;
};

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

export default async function MyEventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen w-full flex justify-center">
        <div className="w-full max-w-3xl px-5 py-10">
          <h1 className="text-2xl font-bold mb-2">My events</h1>
          <p className="text-sm text-muted-foreground">
            Please{" "}
            <Link
              href="/auth/login"
              className="font-medium underline underline-offset-4"
            >
              log in
            </Link>{" "}
            to see the events you&apos;ve registered for.
          </p>
        </div>
      </main>
    );
  }

  const { data, error } = (await supabase
    .from("event_registrations")
    .select(
      "id, created_at, event_id, user_id, events ( id, slug, title, type, start_at, end_at, location, color_code )",
    )
    .eq("user_id", user.id)
    .eq("status", "registered")
    .order("created_at", { ascending: false })) as {
    data: Row[] | null;
    error: unknown;
  };

  if (error) {
    console.error("Error loading my events", error);
  }

  const rows = data?.filter((row) => row.events !== null) ?? [];

  const walletTickets = await Promise.all(
    rows.map(async (row) => {
      const event = row.events!;
      const ticketCode = getTicketCode(row.id);
      const qrDataUrl = await buildTicketQrDataUrl({
        registrationId: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        issuedAt: row.created_at,
      });

      return {
        row,
        event,
        ticketCode,
        qrDataUrl,
      };
    }),
  );

  return (
    <main className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-3xl px-5 py-10 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">My events</h1>
          <p className="text-sm text-muted-foreground">
            Events you&apos;ve registered for with your SESC Events account.
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t registered for any events yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {walletTickets.map((item) => {
              const { row, event, ticketCode, qrDataUrl } = item;

              const accentColor =
                event.color_code &&
                /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(event.color_code)
                  ? event.color_code
                  : "#4f46e5";

              return (
                <li key={row.id}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="block rounded-lg border bg-card hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div className="p-4 flex flex-col gap-4">
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
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDateRange(event.start_at, event.end_at)}
                          </p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {event.type === "virtual"
                                ? "Online · "
                                : "Onsite · "}
                              {event.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Ticket code:{" "}
                            <span className="font-medium">{ticketCode}</span>
                          </p>
                        </div>
                        <QrTicketPreview
                          qrDataUrl={qrDataUrl}
                          title={event.title}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Show this QR code at check-in.
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
