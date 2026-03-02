"use server";

import { createClient } from "@/lib/supabase/server";
import { sendRegistrationEmail } from "@/lib/email";

type RegisterResult =
  | { ok: true }
  | { ok: false; error: "NOT_AUTHENTICATED" | "EVENT_NOT_AVAILABLE" | "EVENT_FULL" | "ALREADY_REGISTERED" | "UNKNOWN_ERROR" };

export async function registerForEvent(slug: string): Promise<RegisterResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "NOT_AUTHENTICATED" };
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

  const { error: insertError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: event.id,
      user_id: user.id,
      status: "registered",
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "ALREADY_REGISTERED" };
    }
    console.error("Error inserting registration", insertError);
    return { ok: false, error: "UNKNOWN_ERROR" };
  }

  try {
    const email = user.email;
    if (email) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

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

  return { ok: true };
}

