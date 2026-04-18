// ─── Tenant ────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  niche: string[];
  plan: "starter" | "growth" | "enterprise";
  is_active: boolean;
  created_at: string;
  total_leads: number;
  total_batches: number;
  published_batches: number;
  leads_this_week: number;
  last_batch_date: string | null;
}

export interface TenantCreate {
  name: string;
  slug: string;
  niche: string[];
  plan: "starter" | "growth" | "enterprise";
}

export interface TenantUpdate {
  name?: string;
  niche?: string[];
  plan?: "starter" | "growth" | "enterprise";
  is_active?: boolean;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "client";
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name?: string;
  role: "admin" | "client";
  tenant_id?: string;
}

// ─── Batch ───────────────────────────────────────────────────────────────────
export interface Batch {
  id: string;
  tenant_id: string;
  label: string;
  niche: string;
  lead_count: number;
  status: "draft" | "published" | "archived";
  source: "manual" | "auto";
  published_at: string | null;
  created_at: string;
  created_by: string | null;
  // detail fields
  hot_leads?: number;
  warm_leads?: number;
  review_leads?: number;
  sent_count?: number;
  replied_count?: number;
}

// ─── Lead ────────────────────────────────────────────────────────────────────
export type ScoreTier = "hot" | "warm" | "review";
export type OutreachStatus = "ready" | "sent" | "replied" | "archived";

export interface PainSignal {
  signal: string;
  confidence: number;
}

export interface HiringTrigger {
  role: string;
  platform: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  batch_id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  niche: string | null;
  ad_spend_signal: string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_linkedin: string | null;
  contact_phone: string | null;
  role_bucket: string | null;
  score: number | null;
  score_tier: ScoreTier | null;
  pain_signals: PainSignal[];
  hiring_triggers: HiringTrigger[];
  email_subject: string | null;
  email_body: string | null;
  outreach_status: OutreachStatus;
  notes: string | null;
  verified_email: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadListItem {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_title: string | null;
  contact_email: string | null;
  niche: string | null;
  score: number | null;
  score_tier: ScoreTier | null;
  outreach_status: OutreachStatus;
  verified_email: boolean;
  batch_id: string;
  created_at: string;
}

export interface LeadPage {
  items: LeadListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface LeadUpdate {
  outreach_status?: OutreachStatus;
  notes?: string;
  verified_email?: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "client";
  tenant_id: string | null;
  accessToken: string;
}
