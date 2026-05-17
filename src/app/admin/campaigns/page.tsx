import { requireAdmin } from "@/lib/admin/auth";
import { CampaignManager } from "@/components/admin/CampaignManager";

export default async function CampaignsPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketing Campaigns</h1>
        <p className="text-text-secondary">
          Create and manage marketing campaigns with automated posting schedules
        </p>
      </div>

      <CampaignManager />
    </div>
  );
}
