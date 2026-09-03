import { requireFullAccess } from "@/lib/admin/auth";

/**
 * Guards every full-access route. Free users are redirected to /wallet.
 *
 * This is deliberately a route-group layout rather than one guard per route:
 * anything added under (full)/ is gated by default, so the failure mode is a
 * locked door rather than an open one.
 */
export default async function FullAccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFullAccess();
  return <>{children}</>;
}
