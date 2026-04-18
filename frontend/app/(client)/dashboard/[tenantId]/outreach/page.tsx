"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useLeads, useUpdateLead } from "@/hooks/useLeads";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { LeadDetailDrawer } from "@/components/dashboard/LeadDetailDrawer";
import type { LeadListItem, OutreachStatus } from "@/types";

const COLUMNS: { status: OutreachStatus; label: string; color: string; bg: string }[] = [
  { status: "ready", label: "Ready", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  { status: "sent", label: "Sent", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { status: "replied", label: "Replied", color: "text-green-700", bg: "bg-green-50 border-green-200" },
];

function LeadCard({
  lead,
  onStatusChange,
  onClick,
}: {
  lead: LeadListItem;
  onStatusChange: (id: string, status: OutreachStatus) => void;
  onClick: () => void;
}) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onClick}
    >
      <p className="font-medium text-sm text-gray-900 truncate">{lead.company_name}</p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.contact_name || "—"}</p>
      <div className="flex items-center justify-between mt-2">
        <ScoreBadge score={lead.score} tier={lead.score_tier} />
        <select
          value={lead.outreach_status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(lead.id, e.target.value as OutreachStatus)}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="ready">Ready</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="archived">Archive</option>
        </select>
      </div>
    </div>
  );
}

export default function OutreachTrackerPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const updateLead = useUpdateLead();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: readyPage } = useLeads({ tenant_id: tenantId, outreach_status: "ready", limit: 100 });
  const { data: sentPage } = useLeads({ tenant_id: tenantId, outreach_status: "sent", limit: 100 });
  const { data: repliedPage } = useLeads({ tenant_id: tenantId, outreach_status: "replied", limit: 100 });

  const columnData: Record<OutreachStatus, LeadListItem[]> = {
    ready: readyPage?.items ?? [],
    sent: sentPage?.items ?? [],
    replied: repliedPage?.items ?? [],
    archived: [],
  };

  const handleStatusChange = async (leadId: string, status: OutreachStatus) => {
    try {
      await updateLead.mutateAsync({ id: leadId, body: { outreach_status: status } });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outreach Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Track and update outreach status across your leads</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(({ status, label, color, bg }) => {
          const leads = columnData[status];
          return (
            <div key={status} className={`rounded-xl border p-3 ${bg}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`font-semibold text-sm ${color}`}>{label}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg} border ${color}`}>
                  {leads.length}
                </span>
              </div>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {leads.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">No leads here</p>
                ) : (
                  leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onStatusChange={handleStatusChange}
                      onClick={() => setSelectedLeadId(lead.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailDrawer leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </div>
  );
}
