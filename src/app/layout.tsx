import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { themeScript } from "@/components/theme/themeScript";
import { getCurrentUser } from "@/lib/auth";
import { hasFullAccess } from "@/lib/admin/auth";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://buildcadence.co"),
  title: "Cadence — Set your daily cadence",
  description:
    "Break goals into daily actions, build streaks with your AI coach, manage your prompt library, and stay accountable with friends. Set your cadence.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "AI coach", "prompts wallet", "cadence"],
  alternates: { canonical: "/" },
  icons: {
    // src/app/icon.svg is the source of truth; favicon.ico is the raster
    // fallback and is what src/hooks/useNotifications.ts points at.
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    // iOS ignores transparency, so the home-screen icon ships opaque.
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fullAccess = hasFullAccess(await getCurrentUser().catch(() => null));

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body
          className="antialiased min-h-screen bg-gradient-to-br from-white via-brand-light/30 to-indigo-50/60 dark:bg-none dark:bg-app"
          suppressHydrationWarning
        >
          <AppShell fullAccess={fullAccess}>
            {children}
          </AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
