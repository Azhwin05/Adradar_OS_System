"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { leadsApi, type LeadsListParams } from "@/lib/api";
import type { AuthUser, LeadUpdate } from "@/types";

function useToken(): string {
  const { data: session } = useSession();
  return (session?.user as AuthUser)?.accessToken ?? "";
}

export function useLeads(params?: LeadsListParams) {
  const token = useToken();
  return useQuery({
    queryKey: ["leads", params],
    queryFn: () => leadsApi.list(token, params),
    enabled: !!token,
  });
}

export function useLead(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => leadsApi.get(token, id),
    enabled: !!token && !!id,
  });
}

export function useUpdateLead() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: LeadUpdate }) =>
      leadsApi.update(token, id, body),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.setQueryData(["lead", lead.id], lead);
    },
  });
}

export function useRegenerateEmail() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.regenerateEmail(token, id),
    onSuccess: (lead) => {
      qc.setQueryData(["lead", lead.id], lead);
    },
  });
}
