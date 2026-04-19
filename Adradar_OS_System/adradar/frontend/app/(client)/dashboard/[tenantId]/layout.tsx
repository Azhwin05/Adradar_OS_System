"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, Send, LogOut, Radar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { AuthUser } from "@/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = useParams<{ tenantId: string }>();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as AuthUser | undefined;

  const nav = [
    { href: `/dashboard/${tenantId}`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `/dashboard/${tenantId}/leads`, label: "Leads", icon: Users },
    { href: `/dashboard/${tenantId}/outreach`, label: "Outreach", icon: Send },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 flex items-center gap-2 border-b border-gray-100">
          <Radar className="w-5 h-5 text-blue-600" />
          <span className="text-gray-900 font-bold text-lg">AdRadar</span>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pb-4 space-y-1">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="pl-56 flex-1 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
