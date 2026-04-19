"use client";

import { Building2, UserCheck, MailCheck, Flame } from "lucide-react";
import type { LeadPage } from "@/types";

interface Props {
  leadsPage: LeadPage | undefined;
  isLoading: boolean;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function PipelineMetrics({ leadsPage, isLoading }: Props) {
  // We use the paginated total as an approximation; real aggregates come from batches
  const totalCompanies = leadsPage?.total ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Companies"
        value={totalCompanies}
        icon={Building2}
        color="bg-blue-500"
        loading={isLoading}
      />
      <MetricCard
        label="Verified Emails"
        value={0}
        icon={MailCheck}
        color="bg-green-500"
        loading={isLoading}
      />
      <MetricCard
        label="Hot Leads"
        value={0}
        icon={Flame}
        color="bg-red-500"
        loading={isLoading}
      />
      <MetricCard
        label="Decision Makers"
        value={0}
        icon={UserCheck}
        color="bg-purple-500"
        loading={isLoading}
      />
    </div>
  );
}
