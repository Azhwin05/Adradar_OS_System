import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-blue-50 text-blue-700 border-blue-200",
  sent: "bg-purple-50 text-purple-700 border-purple-200",
  replied: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-gray-50 text-gray-500 border-gray-200",
  published: "bg-green-50 text-green-700 border-green-200",
  draft: "bg-gray-50 text-gray-600 border-gray-200",
};

export function StatusPill({ status, className }: StatusPillProps) {
  const style = STATUS_STYLES[status] ?? "bg-gray-50 text-gray-400 border-gray-100";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
