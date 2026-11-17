import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Per-page authorization. Layouts are not a security boundary in Next.js
 * (they are not re-run on every client navigation), so every protected page
 * and server action must call one of these itself.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/events");

  return { supabase, user };
}

export async function requireAdminOrVolunteer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_volunteer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_volunteer) redirect("/events");

  return { supabase, user };
}
