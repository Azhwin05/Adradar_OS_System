"use client";

import { useTenants } from "@/hooks/useTenants";
import { useBatches } from "@/hooks/useBatches";
import { useLeads } from "@/hooks/useLeads";
import { formatDate } from "@/lib/utils";
import { StatusPill } from "@/components/shared/StatusPill";
import Link from "next/link";
import { Building2, Users, Package, TrendingUp } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data: tenants, isLoading: loadingTenants } = useTenants();
  const { data: batches, isLoading: loadingBatches } = useBatches();

  const activeTenants = tenants?.filter((t) => t.is_active).length ?? 0;
  const totalLeads = tenants?.reduce((s, t) => s + t.total_leads, 0) ?? 0;
  const totalBatches = batches?.length ?? 0;
  const publishedBatches = batches?.filter((b) => b.status === "published").length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all tenants and lead batches</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Tenants" value={activeTenants} icon={Building2} color="bg-blue-500" />
        <StatCard label="Total Leads" value={totalLeads} icon={Users} color="bg-green-500" />
        <StatCard label="Total Batches" value={totalBatches} icon={Package} color="bg-purple-500" />
        <StatCard label="Published Batches" value={publishedBatches} icon={TrendingUp} color="bg-orange-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Tenants</h2>
          <Link
            href="/admin/tenants"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {loadingTenants ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !tenants?.length ? (
          <div className="p-10 text-center text-gray-400">
            No tenants yet. <Link href="/admin/tenants" className="text-blue-600 hover:underline">Create one</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tenants.slice(0, 6).map((tenant) => (
              <div key={tenant.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <Link
                    href={`/admin/tenants/${tenant.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {tenant.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    slug: {tenant.slug} · {tenant.plan}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{tenant.total_leads} leads</span>
                  <span>{tenant.published_batches} batches</span>
                  <span className="text-xs">
                    {tenant.last_batch_date ? formatDate(tenant.last_batch_date) : "—"}
                  </span>
                  {!tenant.is_active && <StatusPill status="archived" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
