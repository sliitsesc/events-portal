import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AttendanceToggle } from "./AttendanceToggle";

type RegistrantRow = {
  id: string;
  created_at: string;
  status: string;
  attended: boolean;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }[]
    | null;
};

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventRegistrantsPage(props: PageProps) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, start_at")
    .eq("id", params.id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, created_at, status, attended, profiles ( full_name, email )")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading registrants", error);
  }

  const rows = (data ?? []) as RegistrantRow[];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Registrants · {event.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatTimestamp(event.start_at)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No registrations yet for this event.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-left">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Registered at</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Attended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const profile = row.profiles?.[0] ?? null;

                return (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 align-top">
                      {profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className="text-xs text-muted-foreground">
                        {profile?.email ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(row.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-2 align-top text-xs capitalize">
                      {row.status}
                    </td>
                    <td className="px-4 py-2 align-top text-xs">
                      <AttendanceToggle
                        registrationId={row.id}
                        initialAttended={row.attended}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
