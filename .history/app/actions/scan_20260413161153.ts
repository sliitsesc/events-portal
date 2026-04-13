'use server'

import { createClient } from "@/lib/supabase/server"

export async function processScan(eventId: string, registrationId: string) {
  const supabase = await createClient()

  // 1. Check if the ticket actually belongs to this event
  const { data: ticket, error } = await supabase
    .from('event_registrations')
    .select('id, attended, status')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .single()

  if (error || !ticket) return { success: false, message: "Invalid ticket for this event!" }
  if (ticket.status !== 'confirmed') return { success: false, message: "Ticket is not confirmed!" }
  if (ticket.attended) return { success: false, message: "Already checked in!" }

  // 2. Mark as attended
  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({ attended: true })
    .eq('id', registrationId)

  if (updateError) return { success: false, message: "Database error during check-in." }

  return { success: true, message: "Check-in successful!" }
}