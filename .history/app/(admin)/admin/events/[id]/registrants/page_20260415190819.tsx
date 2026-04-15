import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LiveTable } from "./LiveTable";

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

  const initialRows = rows.map((row) => {
    const profile = profileMap.get(row.user_id) ?? null;

    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      status: row.status,
      attended: row.attended,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });

  return (
    <LiveTable
      eventId={event.id}
      eventTitle={event.title}
      eventStartAt={event.start_at}
      initialRows={initialRows}
    />
  );
}
