"use server";

import { createClient } from "@/lib/supabase/server";
import { sendRegistrationEmail } from "@/lib/email";
import { getTicketCode } from "@/lib/tickets";

type RegisterResult =
  | {
      ok: true;
      ticket: {
        registrationId: string;
        ticketCode: string;
        walletPath: string;
      };
    }
  | { ok: false; error: "NOT_AUTHENTICATED" | "EVENT_NOT_AVAILABLE" | "EVENT_FULL" | "ALREADY_REGISTERED" | "UNKNOWN_ERROR" };

export async function updateSecurityData(nicNumber: string, phoneNumber: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      nic_number: nicNumber,
      phone_number: phoneNumber,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating security data", error);
    return { ok: false, error: "UPDATE_FAILED" };
  }

  return { ok: true };
}

export async function registerForEvent(slug: string): Promise<RegisterResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
  }

  const ensuredEmail = user.email?.trim().toLowerCase() ?? null;
  const ensuredFullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : null;

  const { error: profileEnsureError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: ensuredEmail,
      full_name: ensuredFullName,
    },
    { onConflict: "id" },
  );

  if (profileEnsureError) {
    console.error("Error ensuring profile during registration", profileEnsureError);
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, slug, title, start_at, end_at, location, meeting_url, status, capacity",
    )
    .eq("slug", slug)
    .single();

  if (eventError || !event || event.status !== "published") {
    return { ok: false, error: "EVENT_NOT_AVAILABLE" };
  }

  if (event.capacity != null) {
    const { count, error: countError } = await supabase
      .from("event_registrations")
      .select("id", { head: true, count: "exact" })
      .eq("event_id", event.id)
      .eq("status", "registered");

    if (!countError && typeof count === "number" && count >= event.capacity) {
      return { ok: false, error: "EVENT_FULL" };
    }
  }

  const { data: insertedRegistration, error: insertError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: event.id,
      user_id: user.id,
      status: "registered",
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .maybeSingle();

      if (existingRegistration?.id) {
        return {
          ok: true,
          ticket: {
            registrationId: existingRegistration.id,
            ticketCode: getTicketCode(existingRegistration.id),
            walletPath: "/my-events",
          },
        };
      }

      return { ok: false, error: "ALREADY_REGISTERED" };
    }
    console.error("Error inserting registration", insertError);
    return { ok: false, error: "UNKNOWN_ERROR" };
  }

  if (!insertedRegistration) {
    return { ok: false, error: "UNKNOWN_ERROR" };
  }

  try {
    const email = user.email;
    if (email) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://events.sliitsesc.org");

      const eventUrl = `${baseUrl}/events/${event.slug}`;
      const locationLabel =
        event.meeting_url != null
          ? `Online – ${event.meeting_url}`
          : event.location ?? "Onsite";

      await sendRegistrationEmail({
        to: email,
        eventTitle: event.title,
        startAt: event.start_at,
        endAt: event.end_at,
        locationLabel,
        eventUrl,
      });
    }
  } catch (error) {
    console.error("Error sending registration email", error);
  }

  return {
    ok: true,
    ticket: {
      registrationId: insertedRegistration.id,
      ticketCode: getTicketCode(insertedRegistration.id),
      walletPath: "/my-events",
    },
  };
}

