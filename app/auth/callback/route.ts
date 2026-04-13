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
      if (!email || !email.endsWith("@my.sliit.lk")) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/login?error=AccessDenied`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_admin) {
        return NextResponse.redirect(`${origin}/admin/events`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=AccessDenied`);
}