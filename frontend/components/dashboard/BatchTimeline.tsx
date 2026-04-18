import { formatDate } from "@/lib/utils";
import { StatusPill } from "@/components/shared/StatusPill";
import type { Batch } from "@/types";

interface Props {
  batches: Batch[];
}

export function BatchTimeline({ batches }: Props) {
  if (!batches.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Batch Timeline</h3>
        <p className="text-gray-400 text-sm text-center py-6">No batches yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-4">Batch Timeline</h3>
      <div className="relative pl-4">
        {batches.map((batch, i) => (
          <div key={batch.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Line */}
            {i < batches.length - 1 && (
              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-gray-200" />
            )}
            {/* Dot */}
            <div
              className={`relative z-10 w-3.5 h-3.5 rounded-full border-2 mt-1 shrink-0 ${
                i === 0
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
              }`}
            />
            {/* Content */}
            <div className={`flex-1 bg-gray-50 rounded-lg p-3 border ${i === 0 ? "border-blue-200 bg-blue-50" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">{batch.label}</p>
                <StatusPill status={batch.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{batch.lead_count} leads</span>
                <span className="w-px h-3 bg-gray-300" />
                <span className="capitalize">{batch.niche}</span>
                <span className="w-px h-3 bg-gray-300" />
                <span>{formatDate(batch.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
