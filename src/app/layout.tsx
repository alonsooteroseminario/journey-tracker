import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/AppShell";
import { themeScript } from "@/components/theme/themeScript";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence — Set your daily cadence",
  description:
    "Break goals into daily actions, build streaks with your AI coach, manage your prompt library, and stay accountable with friends. Set your cadence.",
  keywords: ["goal tracker", "habit tracker", "streak", "productivity", "AI coach", "prompts wallet", "cadence"],
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
          className="antialiased min-h-screen bg-gradient-to-br from-white via-brand-light/30 to-indigo-50/60 dark:bg-none dark:bg-app"
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
