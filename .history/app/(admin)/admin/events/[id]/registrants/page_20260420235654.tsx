import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
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
  nic_number: string | null;
  phone_number: string | null;
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
    .select("id, title, start_at, type")
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
  const adminSupabase = createAdminClient();

  let profileMap = new Map<string, ProfileRow>();
  if (userIds.length > 0) {
    const profileReader = adminSupabase ?? supabase;
    const { data: profileData, error: profileError } = await profileReader
      .from("profiles")
      .select("id, full_name, email, nic_number, phone_number")
      .in("id", userIds);

    if (profileError) {
      console.error("Error loading profiles for registrants", profileError);
    } else {
      if ((profileData?.length ?? 0) < userIds.length && !adminSupabase) {
        console.warn(
          "Profiles query returned partial rows. This usually means profiles RLS blocks admin-wide reads. Configure an admin SELECT policy or SUPABASE_SERVICE_ROLE_KEY.",
        );
      }

      profileMap = new Map(
        ((profileData ?? []) as ProfileRow[]).map((profile) => [
          profile.id,
          profile,
        ]),
      );
    }

    const missingProfileUserIds = userIds.filter((id) => !profileMap.has(id));

    if (missingProfileUserIds.length > 0 && adminSupabase) {
      const recoveredProfiles = (
        await Promise.all(
          missingProfileUserIds.map(async (userId) => {
            const { data: authData, error: authError } =
              await adminSupabase.auth.admin.getUserById(userId);

            if (authError || !authData?.user) {
              if (authError) {
                console.error(
                  "Error reading auth user for missing profile",
                  userId,
                  authError,
                );
              }
              return null;
            }

            const email = authData.user.email?.trim().toLowerCase() ?? null;
            const fullName =
              typeof authData.user.user_metadata?.full_name === "string"
                ? authData.user.user_metadata.full_name.trim()
                : email
                  ? email.split("@")[0]
                  : null;

            return {
              id: userId,
              email,
              full_name: fullName,
              nic_number: null,
              phone_number: null,
            };
          }),
        )
      ).filter(
        (
          profile,
        ): profile is {
          id: string;
          email: string | null;
          full_name: string | null;
          nic_number: string | null;
          phone_number: string | null;
        } => profile !== null,
      );

      if (recoveredProfiles.length > 0) {
        const { error: upsertRecoveredError } = await adminSupabase
          .from("profiles")
          .upsert(recoveredProfiles, { onConflict: "id" });

        if (upsertRecoveredError) {
          console.error(
            "Error upserting recovered registrant profiles",
            upsertRecoveredError,
          );
        }

        recoveredProfiles.forEach((profile) => {
          profileMap.set(profile.id, {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            nic_number: profile.nic_number,
            phone_number: profile.phone_number,
          });
        });
      }
    }
  }

  const initialRows = rows.map((row) => {
    const profile = profileMap.get(row.user_id) ?? null;
    const safeEmail = profile?.email?.trim() || null;
    const safeName =
      profile?.full_name?.trim() ||
      (safeEmail ? safeEmail.split("@")[0] : `User ${row.user_id.slice(0, 8)}`);

    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      status: row.status,
      attended: row.attended,
      full_name: safeName,
      email: safeEmail,
      nic_number: profile?.nic_number ?? null,
      phone_number: profile?.phone_number ?? null,
    };
  });

  return (
    <LiveTable
      eventId={event.id}
      eventType={event.type}
      eventTitle={event.title}
      eventStartAt={event.start_at}
      initialRows={initialRows}
    />
  );
}
