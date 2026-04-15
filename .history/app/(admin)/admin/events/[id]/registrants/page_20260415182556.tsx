import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceToggle } from "./AttendanceToggle";

type RegistrantRow = {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  attended: boolean;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
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
    .select("id, user_id, created_at, status, attended")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading registrants", error);
  }

  const rows = (data ?? []) as RegistrantRow[];
  const registrantCount = rows.length;
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];

  let profileMap = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profileError) {
      console.error("Error loading profiles for registrants", profileError);
    } else {
      profileMap = new Map(
        ((profileData ?? []) as ProfileRow[]).map((profile) => [
          profile.id,
          profile,
        ]),
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full sm:w-fit">
        <CardContent className="p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Registrant Count
          </p>
          <p className="mt-1 text-3xl font-bold leading-none">
            {registrantCount}
          </p>
        </CardContent>
      </Card>

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
                const profile = profileMap.get(row.user_id) ?? null;

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
