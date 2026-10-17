"use server";

import { writeAdminAuditLog as writeAuditLog } from "@/app/utils/audit";
import { createClient } from "@/lib/supabase/server";

// A failed audit write must not change the outcome of a scan.
async function writeAdminAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
  } catch (error) {
    console.error("Scan audit log failed", error);
  }
}

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
    .select("is_admin, is_volunteer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_volunteer) {
    return {
      success: false,
      message: "Only admins or volunteers can scan tickets.",
    };
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
  // Conditional on attended = false so concurrent scans of one ticket cannot both succeed.
  const { data: updated, error: updateError } = await supabase
    .from("event_registrations")
    .update({ attended: true })
    .eq("id", registrationId)
    .eq("attended", false)
    .select("id");

  if (updateError) {
    await writeAdminAuditLog({
      action: "SCAN_FAILED_DB_UPDATE",
      targetType: "registration",
      targetId: registrationId,
      details: { eventId, message: updateError.message },
    });

    return { success: false, message: "Database error during check-in." };
  }

  if (!updated || updated.length === 0) {
    return { success: false, message: "This ticket is already checked in." };
  }

  await writeAdminAuditLog({
    action: "SCAN_CHECK_IN_SUCCESS",
    targetType: "registration",
    targetId: registrationId,
    details: { eventId },
  });

  return { success: true, message: "Check-in successful." };
}