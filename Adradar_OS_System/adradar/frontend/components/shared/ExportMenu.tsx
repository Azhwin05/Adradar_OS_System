"use client";

import { useSession } from "next-auth/react";
import { Download } from "lucide-react";
import { exportApi } from "@/lib/api";
import type { AuthUser } from "@/types";

interface ExportMenuProps {
  tenantId: string;
  batchId?: string;
}

export function ExportMenu({ tenantId, batchId }: ExportMenuProps) {
  const { data: session } = useSession();
  const token = (session?.user as AuthUser)?.accessToken;

  const download = (url: string) => {
    const a = document.createElement("a");
    a.href = url + (token ? `&token=${token}` : "");
    a.href = url; // backend uses auth middleware via query or header
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => download(exportApi.csvUrl(tenantId, batchId))}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
      <button
        onClick={() => download(exportApi.emailsUrl(tenantId, batchId))}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export Emails
      </button>
    </div>
  );
}
