"use client";

import { useState, useEffect, useCallback } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useBatches } from "@/hooks/useBatches";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { ExportMenu } from "@/components/shared/ExportMenu";
import { Search, ChevronLeft, ChevronRight, MailCheck } from "lucide-react";

interface Props {
  tenantId: string;
  initialBatchId?: string;
}

export function LeadTable({ tenantId, initialBatchId }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [niche, setNiche] = useState("");
  const [scoreTier, setScoreTier] = useState("");
  const [outreachStatus, setOutreachStatus] = useState("");
  const [batchId, setBatchId] = useState(initialBatchId ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useLeads({
    tenant_id: tenantId,
    batch_id: batchId || undefined,
    niche: niche || undefined,
    score_tier: scoreTier || undefined,
    outreach_status: outreachStatus || undefined,
    search: debouncedSearch || undefined,
    verified_email: verifiedOnly || undefined,
    page,
    limit: 50,
  });

  const { data: batches } = useBatches({ tenant_id: tenantId });

  const niches = Array.from(new Set(data?.items.map((l) => l.niche).filter(Boolean)));

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search company or contact…"
            />
          </div>

          <select value={batchId} onChange={(e) => { setBatchId(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All batches</option>
            {batches?.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>

          <select value={niche} onChange={(e) => { setNiche(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All niches</option>
            {niches.map((n) => <option key={n!} value={n!}>{n}</option>)}
          </select>

          <select value={scoreTier} onChange={(e) => { setScoreTier(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All tiers</option>
            <option value="hot">🔥 Hot</option>
            <option value="warm">✅ Warm</option>
            <option value="review">⚠️ Review</option>
          </select>

          <select value={outreachStatus} onChange={(e) => { setOutreachStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All statuses</option>
            <option value="ready">Ready</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }} className="rounded" />
            <MailCheck className="w-4 h-4 text-green-500" />
            Verified only
          </label>

          <div className="ml-auto">
            <ExportMenu tenantId={tenantId} batchId={batchId || undefined} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No leads found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Niche</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.company_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.contact_name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{lead.contact_title || "—"}</td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={lead.score} tier={lead.score_tier} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{lead.niche || "—"}</td>
                      <td className="px-4 py-3">
                        {lead.verified_email && (
                          <MailCheck className="w-4 h-4 text-green-500" aria-label="Verified" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={lead.outreach_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} of {data.total} leads
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {data.pages}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === data.pages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </div>
  );
}
