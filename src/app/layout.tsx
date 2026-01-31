import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Journey Tracker - Track Your Goals & Build Streaks",
  description:
    "A motivational goal tracking app with Duolingo-style streaks. Set goals, split tasks, and track your daily progress.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "tasks"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body 
          className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
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
