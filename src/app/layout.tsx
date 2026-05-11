import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { themeScript } from "@/components/theme/themeScript";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journey Tracker - Track Your Goals & Build Streaks",
  description:
    "A motivational goal tracking app with Duolingo-style streaks. Set goals, split tasks, and track your daily progress.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "tasks"],
  icons: {
    icon: "/brand-icon.png",
    apple: "/brand-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body
          className="antialiased min-h-screen bg-gradient-to-br from-white via-brand-light/30 to-indigo-50/60"
          suppressHydrationWarning
        >
          <AppShell>
            {children}
          </AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
