import { requireAdmin } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ReduxProvider } from "@/store/provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check - redirects if not admin
  await requireAdmin();

  return (
    <ReduxProvider>
      <div className="min-h-screen bg-surface-muted">
        <AdminSidebar />
        <main className="ml-64 p-8">{children}</main>
      </div>
    </ReduxProvider>
  );
}
