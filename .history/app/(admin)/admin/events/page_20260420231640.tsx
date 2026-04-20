import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { DeleteEventButton } from "./shared/DeleteEventButton";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  type: "onsite" | "virtual";
  start_at: string;
  status: "draft" | "published" | "archived";
  capacity: number | null;
  registrations_count: number;
};

function formatDate(startIso: string) {
  const date = new Date(startIso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, type, start_at, status, capacity, event_registrations ( id )",
    );

  if (error) {
    console.error("Error loading events for admin", error);
  }

  const rows: EventRow[] =
    data?.map((event: any) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      type: event.type,
      start_at: event.start_at,
      status: event.status,
      capacity: event.capacity,
      registrations_count: Array.isArray(event.event_registrations)
        ? event.event_registrations.length
        : 0,
    })) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Events</h2>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          New event
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No events created yet. Create your first event to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Registrations</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-2 align-top">
                    <div className="flex flex-col">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        /events/{event.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.start_at)}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top capitalize text-xs text-muted-foreground">
                    {event.type}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                    {event.registrations_count}
                    {event.capacity != null ? ` / ${event.capacity}` : ""}
                  </td>
                  <td className="px-4 py-2 align-top text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/registrants`}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Registrants
                      </Link>
                      {event.type === "onsite" ? (
                        <Link
                          href={`/admin/events/${event.id}/scan`}
                          className="ml-2 text-xs font-semibold text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline"
                        >
                          Scan QR
                        </Link>
                      ) : (
                        <span className="ml-2 text-xs text-muted-foreground/70">
                          No scan
                        </span>
                      )}
                      
                      <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
