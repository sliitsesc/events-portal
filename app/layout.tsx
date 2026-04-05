import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
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
            <div className="flex-1 flex flex-col">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
