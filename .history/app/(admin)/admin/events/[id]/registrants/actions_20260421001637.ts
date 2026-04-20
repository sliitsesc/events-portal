"use server";

import { writeAdminAuditLog } from "@/app/utils/audit";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache"; // <-- Don't forget to import this!

// =========================================================================
// 1. YOUR EXISTING ATTENDANCE TOGGLE (Perfect as-is)
// =========================================================================
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

// =========================================================================
// 2. NEW: INDUSTRY VISIT REGISTRATION (With Security Data)
// =========================================================================
export async function registerWithSecurityData(
  eventId: string, 
  nicNumber: string, 
  phoneNumber: string
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  // 1. Update the student's profile with the new security data
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ 
      nic_number: nicNumber, 
      phone_number: phoneNumber 
    })
    .eq("id", user.id);

  if (profileError) throw new Error("Failed to update profile security data.");

  // 2. Create the Event Registration
  // Note: Industry visits usually require Admin approval, so we default to "pending"
  const { error: regError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: "pending", 
    });

  if (regError) throw new Error("Registration failed.");

  // 3. Log the registration action
  await writeAdminAuditLog({
    action: "INDUSTRY_VISIT_REGISTRATION",
    targetType: "registration",
    targetId: eventId,
    details: { user_id: user.id },
  });

  // 4. Refresh the page to show the updated button state
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

// =========================================================================
// 3. NEW: STANDARD EVENT REGISTRATION (For normal campus events)
// =========================================================================
export async function registerForEvent(eventId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { error: regError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: user.id,
      status: "confirmed", // Normal events might not need approval
    });

  if (regError) throw new Error("Registration failed.");

  revalidatePath(`/events/${eventId}`);
  return { success: true };
}