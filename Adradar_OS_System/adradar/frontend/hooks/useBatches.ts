"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { batchesApi } from "@/lib/api";
import type { AuthUser } from "@/types";

function useToken(): string {
  const { data: session } = useSession();
  return (session?.user as AuthUser)?.accessToken ?? "";
}

export function useBatches(params?: { tenant_id?: string; batch_status?: string }) {
  const token = useToken();
  return useQuery({
    queryKey: ["batches", params],
    queryFn: () => batchesApi.list(token, params),
    enabled: !!token,
  });
}

export function useBatch(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ["batch", id],
    queryFn: () => batchesApi.get(token, id),
    enabled: !!token && !!id,
  });
}

export function usePublishBatch() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchesApi.publish(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}

export function useUploadBatch() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => batchesApi.upload(token, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}

export function useArchiveBatch() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchesApi.delete(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}
