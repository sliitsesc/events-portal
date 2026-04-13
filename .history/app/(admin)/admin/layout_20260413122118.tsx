import { ReactNode } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: Props) {
  const cookieStore = await cookies();
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/events");
  }

  return (
    <main className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-5xl px-5 py-8 flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              SESC Events · Admin
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage events, registrations, and attendance.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/events"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <Link
              href="/admin/events"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <Link
              href="/events"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to site
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
