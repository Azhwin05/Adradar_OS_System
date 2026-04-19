/**
 * Typed API client — thin wrapper around fetch.
 * All requests are authenticated via the session's accessToken.
 */
import type {
  Batch,
  Lead,
  LeadPage,
  LeadUpdate,
  Tenant,
  TenantCreate,
  TenantUpdate,
  User,
  UserCreate,
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { token, params, ...init } = options;

  let url = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const json = await res.json();
      detail = json.detail ?? detail;
    } catch (_) {}
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  me: (token: string) => request<User>("/auth/me", { token }),
};

// ─── Tenants ──────────────────────────────────────────────────────────────────

export const tenantsApi = {
  list: (token: string) => request<Tenant[]>("/tenants", { token }),
  get: (token: string, id: string) => request<Tenant>(`/tenants/${id}`, { token }),
  create: (token: string, body: TenantCreate) =>
    request<Tenant>("/tenants", { method: "POST", body: JSON.stringify(body), token }),
  update: (token: string, id: string, body: TenantUpdate) =>
    request<Tenant>(`/tenants/${id}`, { method: "PATCH", body: JSON.stringify(body), token }),
  delete: (token: string, id: string) =>
    request<void>(`/tenants/${id}`, { method: "DELETE", token }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (token: string, tenantId?: string) =>
    request<User[]>("/users", { token, params: { tenant_id: tenantId } }),
  create: (token: string, body: UserCreate) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(body), token }),
};

// ─── Batches ─────────────────────────────────────────────────────────────────

export const batchesApi = {
  list: (token: string, params?: { tenant_id?: string; batch_status?: string }) =>
    request<Batch[]>("/batches", { token, params }),
  get: (token: string, id: string) => request<Batch>(`/batches/${id}`, { token }),
  upload: (token: string, formData: FormData) =>
    request<Batch>("/batches", { method: "POST", body: formData, token }),
  update: (token: string, id: string, body: Partial<Batch>) =>
    request<Batch>(`/batches/${id}`, { method: "PATCH", body: JSON.stringify(body), token }),
  publish: (token: string, id: string) =>
    request<Batch>(`/batches/${id}/publish`, { method: "POST", token }),
  delete: (token: string, id: string) =>
    request<void>(`/batches/${id}`, { method: "DELETE", token }),
};

// ─── Leads ───────────────────────────────────────────────────────────────────

export interface LeadsListParams extends Record<string, string | number | boolean | undefined> {
  tenant_id?: string;
  batch_id?: string;
  niche?: string;
  score_tier?: string;
  outreach_status?: string;
  search?: string;
  verified_email?: boolean;
  page?: number;
  limit?: number;
}

export const leadsApi = {
  list: (token: string, params?: LeadsListParams) =>
    request<LeadPage>("/leads", { token, params }),
  get: (token: string, id: string) => request<Lead>(`/leads/${id}`, { token }),
  update: (token: string, id: string, body: LeadUpdate) =>
    request<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body), token }),
  regenerateEmail: (token: string, id: string) =>
    request<Lead>(`/leads/${id}/regenerate-email`, { method: "POST", token }),
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportApi = {
  csvUrl: (tenantId: string, batchId?: string) => {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (batchId) params.set("batch_id", batchId);
    return `${BASE}/export/csv?${params}`;
  },
  emailsUrl: (tenantId: string, batchId?: string) => {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (batchId) params.set("batch_id", batchId);
    return `${BASE}/export/emails?${params}`;
  },
};
