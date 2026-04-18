"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { tenantsApi, usersApi } from "@/lib/api";
import type { AuthUser, TenantCreate, TenantUpdate, UserCreate } from "@/types";

function useToken(): string {
  const { data: session } = useSession();
  return (session?.user as AuthUser)?.accessToken ?? "";
}

export function useTenants() {
  const token = useToken();
  return useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.list(token),
    enabled: !!token,
  });
}

export function useTenant(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.get(token, id),
    enabled: !!token && !!id,
  });
}

export function useCreateTenant() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TenantCreate) => tenantsApi.create(token, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useUpdateTenant() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TenantUpdate }) =>
      tenantsApi.update(token, id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useTenantUsers(tenantId: string) {
  const token = useToken();
  return useQuery({
    queryKey: ["users", tenantId],
    queryFn: () => usersApi.list(token, tenantId),
    enabled: !!token && !!tenantId,
  });
}

export function useCreateUser() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UserCreate) => usersApi.create(token, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
