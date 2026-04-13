"use server";

import { writeAdminAuditLog } from "@/app/utils/audit";
import { createClient } from "@/lib/supabase/server";

export async function processScan(eventId: string, registrationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { success: false, message: "Only admins can scan tickets." };
  }

  // 1. Check if the ticket actually belongs to this event
  const { data: ticket, error } = await supabase
    .from("event_registrations")
    .select("id, attended, status, event_id")
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .single();

  if (error || !ticket) {
    await writeAdminAuditLog({
      action: "SCAN_REJECTED_INVALID_TICKET",
      targetType: "registration",
      targetId: registrationId,
      details: { eventId },
    });

    return { success: false, message: "Invalid ticket for this event." };
  }

  if (ticket.status !== "registered") {
    await writeAdminAuditLog({
      action: "SCAN_REJECTED_WRONG_STATUS",
      targetType: "registration",
      targetId: registrationId,
      details: { eventId, status: ticket.status },
    });

    return { success: false, message: "Ticket is not in registered state." };
  }

  if (ticket.attended) {
    await writeAdminAuditLog({
      action: "SCAN_REJECTED_ALREADY_CHECKED_IN",
      targetType: "registration",
      targetId: registrationId,
      details: { eventId },
    });

    return { success: false, message: "This ticket is already checked in." };
  }

  // 2. Mark as attended
  const { error: updateError } = await supabase
    .from("event_registrations")
    .update({ attended: true })
    .eq("id", registrationId);

  if (updateError) {
    await writeAdminAuditLog({
      action: "SCAN_FAILED_DB_UPDATE",
      targetType: "registration",
      targetId: registrationId,
      details: { eventId, message: updateError.message },
    });

    return { success: false, message: "Database error during check-in." };
  }

  await writeAdminAuditLog({
    action: "SCAN_CHECK_IN_SUCCESS",
    targetType: "registration",
    targetId: registrationId,
    details: { eventId },
  });

  return { success: true, message: "Check-in successful." };
}