"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";

export function Navbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Student");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEmail(null);
        setDisplayName("Student");
        setIsAdmin(false);
        return;
      }

      setEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, full_name")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean(profile?.is_admin));
      setDisplayName(
        profile?.full_name?.trim() ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Student",
      );
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
      <div className="max-w-5xl mx-auto px-5 text-sm">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-4 font-semibold">
            <Link
              href="/"
              className="tracking-tight"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              SESC Events
            </Link>
            <div className="hidden md:flex items-center gap-4 font-semibold">
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
          </div>

          <div className="hidden md:flex ml-auto items-center gap-2">
            {email ? (
              <div className="flex items-center gap-4">
                Hey, {displayName}! <LogoutButton />
              </div>
            ) : (
              <Button asChild size="sm" variant="default">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            )}
            <ThemeSwitcher />
          </div>

          <div className="md:hidden ml-auto flex items-center gap-2">
            <ThemeSwitcher />
            <Button
              variant="outline"
              size="sm"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-b-foreground/10 py-3 flex flex-col gap-3">
            <div className="flex flex-col gap-2 font-medium">
              <Link
                href={primaryLinkHref}
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {primaryLinkLabel}
              </Link>
              {showMyEventsLink && (
                <Link
                  href="/my-events"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Events
                </Link>
              )}
            </div>

            {email ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground truncate max-w-[70%]">
                  Hey, {displayName}!
                </p>
                <LogoutButton />
              </div>
            ) : (
              <Button asChild size="sm" variant="default" className="w-full">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
