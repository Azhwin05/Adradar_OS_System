import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

export function scoreColor(tier: string | null | undefined): string {
  switch (tier) {
    case "hot":
      return "text-red-600 bg-red-50 border-red-200";
    case "warm":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "review":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-400 bg-gray-50 border-gray-100";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "ready":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "sent":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "replied":
      return "text-green-600 bg-green-50 border-green-200";
    case "archived":
      return "text-gray-400 bg-gray-50 border-gray-200";
    case "published":
      return "text-green-600 bg-green-50 border-green-200";
    case "draft":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-400 bg-gray-50 border-gray-100";
  }
}

export function batchStatusColor(status: string): string {
  switch (status) {
    case "published":
      return "text-green-700 bg-green-50 border-green-200";
    case "draft":
      return "text-gray-600 bg-gray-50 border-gray-200";
    case "archived":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-400 bg-gray-50 border-gray-100";
  }
}
