import { requireAdmin } from "@/lib/admin/auth";
import { MarketingDashboard } from "@/components/admin/MarketingDashboard";

export default async function MarketingPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketing Command Center</h1>
        <p className="text-text-secondary">
          AI-powered campaign management and content generation
        </p>
      </div>

      <MarketingDashboard />
    </div>
  );
}
