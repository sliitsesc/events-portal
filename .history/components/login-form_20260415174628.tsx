"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const requestedRedirect = searchParams.get("redirect");
      const safeRedirect =
        requestedRedirect && requestedRedirect.startsWith("/")
          ? requestedRedirect
          : "/";

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`,
          queryParams: {
            hd: "my.sliit.lk",
          },
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
      return;
    } finally {
      // OAuth redirects away when successful; keep loading state only for local failures.
    }
  };

  const resolvedError =
    error ??
    (callbackError === "AccessDenied"
      ? "Only official @my.sliit.lk accounts can access this platform."
      : callbackError === "SsoOnly"
        ? "This platform uses Google SSO only. Continue with your SLIIT account."
        : null);

  const highlights = [
    "Verified @my.sliit.lk access only",
    "One-click registration for all SESC events",
    "Instant ticket and QR access after sign-in",
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card/95 p-6 shadow-sm md:p-8",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-4 h-32 w-32 rounded-full bg-blue-300/25 blur-3xl" />

      <div className="relative grid gap-7 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            SESC Student Access
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            Continue To
            <br />
            Your Event Portal
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sign in with your official SLIIT Google account to manage
            registrations, tickets, and event-day check-ins.
          </p>

          <ul className="space-y-2 pt-1 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/events"
            className="mt-1 inline-flex w-fit rounded-md border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Browse Public Events
          </Link>
        </div>

        <Card className="rounded-2xl border bg-background/90">
          <CardHeader>
            <CardTitle className="text-2xl">SESC Portal Login</CardTitle>
            <CardDescription>
              Continue with your official SLIIT email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center gap-2"
                disabled={isLoading}
                onClick={handleGoogleLogin}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {isLoading
                  ? "Connecting to SLIIT..."
                  : "Continue with SLIIT Email"}
              </Button>

              {resolvedError && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {resolvedError}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Only <span className="font-semibold">@my.sliit.lk</span> Google
                accounts can sign in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
