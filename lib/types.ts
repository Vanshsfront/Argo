export type Role = "admin" | "team" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  assigned_client_ids: number[];
}

export interface Client {
  id: number;
  full_name: string;
  business_name: string | null;
  niche: string | null;
  target_audience: string | null;
  platforms: string[];
  content_pillars: string[];
  tone: string | null;
  goals: string | null;
  avoid: string | null;
  start_date: string | null;
  end_date: string | null;
  retainer_amount: number;
  notes: string | null;
  archived: boolean;
  status: "green" | "yellow" | "red";
}

export interface Task {
  id: number;
  title: string;
  due_date: string | null;
  tag: string | null;
  client_id: number | null;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  source: string;
  source_ref: string | null;
  client_name?: string | null;
}

export const PROSPECT_STAGES = [
  "Identified",
  "Contacted",
  "Responded",
  "Discovery Call",
  "Proposal Sent",
  "Negotiating",
  "Closed Won",
  "Closed Lost",
] as const;

export type ProspectStage = (typeof PROSPECT_STAGES)[number];

export interface Prospect {
  id: number;
  full_name: string;
  platform: string | null;
  niche: string | null;
  deal_value: number;
  stage: ProspectStage;
  stage_entered_at: string;
  date_added: string;
  next_follow_up: string | null;
  next_action: string | null;
  lead_source: string | null;
  converted_client_id: number | null;
  sort_order: number;
}

export const CONTENT_STATUSES = [
  "Briefed",
  "Scripted",
  "Approved",
  "Scheduled",
  "Posted",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const PRODUCTION_STAGES = [
  "Brief",
  "Scripting",
  "Review",
  "Approved",
  "Posted",
] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export const PLATFORMS = ["Instagram", "LinkedIn", "X", "YouTube"] as const;
export const FORMATS = [
  "Short Video",
  "Carousel",
  "Thread",
  "Long-form",
  "Story",
] as const;

export interface ContentItem {
  id: number;
  client_id: number;
  title: string;
  platform: string | null;
  format: string | null;
  status: ContentStatus;
  scheduled_date: string | null;
  script: string | null;
  notes: string | null;
  post_link: string | null;
  perf_views: number | null;
  perf_likes: number | null;
  perf_comments: number | null;
  perf_saves: number | null;
  assignee_id: string | null;
  due_date: string | null;
  in_production: boolean;
  production_stage: ProductionStage;
  sort_order: number;
  client_name?: string;
  assignee_name?: string | null;
}

export interface Resource {
  id: number;
  client_id: number;
  title: string;
  type: string | null;
  url: string | null;
  description: string | null;
}

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Invoice {
  id: number;
  client_id: number;
  amount: number;
  issue_date: string | null;
  due_date: string | null;
  status: InvoiceStatus;
  payment_method: string | null;
  notes: string | null;
  paid_at: string | null;
  client_name?: string;
}
