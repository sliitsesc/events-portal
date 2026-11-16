import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${origin}/auth/login?error=AccessDenied`);
      }

      const email = user.email?.trim().toLowerCase();

      const fullName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : null;

      const { data: profile, error: profileEnsureError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email,
            full_name: fullName || null,
          },
          { onConflict: "id" },
        )
        .select("is_admin")
        .single();

      if (profileEnsureError) {
        console.error("Failed to ensure profile in auth callback", profileEnsureError);
      }

      if (profile?.is_admin) {
        return NextResponse.redirect(`${origin}/admin/events`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=AccessDenied`);
}