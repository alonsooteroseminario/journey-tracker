import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasFullAccess } from "@/lib/admin/auth";
import { LandingPage } from "@/components/LandingPage";
import { HomeDashboard } from "@/components/HomeDashboard";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) return <LandingPage />;
  if (!hasFullAccess(user)) redirect("/wallet");

  return <HomeDashboard />;
}
