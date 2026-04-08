import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Navbar() {
  return (
    <nav className="w-full border-b border-b-foreground/10">
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between px-5 text-sm">
        <div className="flex items-center gap-4 font-semibold">
          <Link href="/" className="tracking-tight">
            SESC Events
          </Link>
          <Link
            href="/events"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Events
          </Link>
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
