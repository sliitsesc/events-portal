"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setIsAdmin(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean(profile?.is_admin));
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const primaryLinkHref = isAdmin ? "/admin/events" : "/events";
  const primaryLinkLabel = isAdmin ? "Dashboard" : "Events";
  const showMyEventsLink = Boolean(email) && !isAdmin;

  return (
    <nav className="w-full border-b border-b-foreground/10">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-5 text-sm">
        <div className="flex items-center gap-4 font-semibold">
          <Link href="/" className="tracking-tight">
            SESC Events
          </Link>
          <Link
            href={primaryLinkHref}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {primaryLinkLabel}
          </Link>
          {showMyEventsLink && (
            <Link
              href="/my-events"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              My Events
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {email ? (
            <div className="flex items-center gap-4">
              Hey, {email}! <LogoutButton />
            </div>
          ) : (
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="default">
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}
