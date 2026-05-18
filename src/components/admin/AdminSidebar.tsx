"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Explorer", href: "/admin/explorer", icon: "🔍" },
  { name: "Social Accounts", href: "/admin/social", icon: "🌐" },
  { name: "Posts", href: "/admin/posts", icon: "📝" },
  { name: "Videos", href: "/admin/videos", icon: "🎬" },
  { name: "Recordings", href: "/admin/recordings", icon: "🎥" },
  { name: "Campaigns", href: "/admin/campaigns", icon: "📢" },
  { name: "Marketing", href: "/admin/marketing", icon: "💼" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Cadence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-brand-primary text-white"
                  : "text-text-muted hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-white transition-colors"
        >
          <span>←</span>
          <span className="text-sm">Back to App</span>
        </Link>
      </div>
    </aside>
  );
}
