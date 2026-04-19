"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Eye, Send, Archive } from "lucide-react";
import { useBatches, usePublishBatch, useArchiveBatch } from "@/hooks/useBatches";
import { useTenants } from "@/hooks/useTenants";
import { StatusPill } from "@/components/shared/StatusPill";
import { formatDate } from "@/lib/utils";

export default function AdminBatchesPage() {
  const [tenantFilter, setTenantFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: tenants } = useTenants();
  const { data: batches, isLoading } = useBatches({
    tenant_id: tenantFilter || undefined,
    batch_status: statusFilter || undefined,
  });

  const publishBatch = usePublishBatch();
  const archiveBatch = useArchiveBatch();

  const tenantMap = Object.fromEntries((tenants ?? []).map((t) => [t.id, t]));

  const handlePublish = async (id: string) => {
    try {
      await publishBatch.mutateAsync(id);
      toast.success("Batch published");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveBatch.mutateAsync(id);
      toast.success("Batch archived");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 text-sm mt-1">All lead batches across tenants</p>
        </div>
        <Link
          href="/admin/batches/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Upload Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All tenants</option>
          {tenants?.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !batches?.length ? (
          <div className="p-12 text-center text-gray-400">
            No batches found. <Link href="/admin/batches/new" className="text-blue-600 hover:underline">Upload one</Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                <th className="px-6 py-3">Label</th>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Niche</th>
                <th className="px-6 py-3">Leads</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{b.label}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {tenantMap[b.tenant_id]?.name ?? b.tenant_id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{b.niche}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{b.lead_count}</td>
                  <td className="px-6 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-6 py-3 text-sm text-gray-400">{formatDate(b.created_at)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/${b.tenant_id}/leads?batch_id=${b.id}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                        title="View leads"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {b.status === "draft" && (
                        <button
                          onClick={() => handlePublish(b.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600"
                          title="Publish"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {b.status !== "archived" && (
                        <button
                          onClick={() => handleArchive(b.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
