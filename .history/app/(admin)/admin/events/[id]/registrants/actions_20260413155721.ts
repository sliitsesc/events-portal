"use server";

import { writeAdminAuditLog } from "@/app/utils/audit";
import { createClient } from "@/lib/supabase/server";

export async function toggleAttendanceOnServer(
  id: string,
  attended: boolean,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Not authorized");
  }

  const { error } = await supabase
    .from("event_registrations")
    .update({ attended })
    .eq("id", id);

  if (error) {
    throw error;
  }

  await writeAdminAuditLog({
    action: "REGISTRATION_ATTENDANCE_UPDATED",
    targetType: "registration",
    targetId: id,
    details: {
      attended,
    },
  });
}

