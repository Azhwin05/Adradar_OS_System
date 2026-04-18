"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { LeadListItem } from "@/types";

interface Props {
  leads: LeadListItem[];
}

const COLORS = {
  ready: "#3b82f6",
  sent: "#8b5cf6",
  replied: "#10b981",
  archived: "#9ca3af",
};

export function OutreachFunnel({ leads }: Props) {
  const counts = leads.reduce(
    (acc, l) => {
      acc[l.outreach_status] = (acc[l.outreach_status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = [
    { name: "Ready", value: counts.ready ?? 0, color: COLORS.ready },
    { name: "Sent", value: counts.sent ?? 0, color: COLORS.sent },
    { name: "Replied", value: counts.replied ?? 0, color: COLORS.replied },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Outreach Funnel</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={55} />
          <Tooltip />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
