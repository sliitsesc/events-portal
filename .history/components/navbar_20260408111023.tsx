import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";

async function AdminAwareNavLink() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = Boolean(profile?.is_admin);
  }

  const primaryLinkHref = isAdmin ? "/admin/events" : "/events";
  const primaryLinkLabel = isAdmin ? "Dashboard" : "Events";

  return (
    <Link
      href={primaryLinkHref}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {primaryLinkLabel}
    </Link>
  );
}

export function Navbar() {
  const defaultNavLink = (
    <Link
      href="/events"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      Events
    </Link>
  );

  return (
    <nav className="w-full border-b border-b-foreground/10">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-5 text-sm">
        <div className="flex items-center gap-4 font-semibold">
          <Link href="/" className="tracking-tight">
            SESC Events
          </Link>
          <Suspense fallback={defaultNavLink}>
            <AdminAwareNavLink />
          </Suspense>
        </div>
        <Suspense>
          <div className="ml-auto flex items-center gap-2">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </Suspense>
      </div>
    </nav>
  );
}
