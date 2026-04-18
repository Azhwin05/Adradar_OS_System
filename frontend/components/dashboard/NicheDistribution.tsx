"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { LeadListItem } from "@/types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

interface Props {
  leads: LeadListItem[];
}

export function NicheDistribution({ leads }: Props) {
  const counts = leads.reduce(
    (acc, l) => {
      const niche = l.niche ?? "Unknown";
      acc[niche] = (acc[niche] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm">No niche data</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Niche Distribution</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
