export const weekOfEngagement = (
  start: string | Date | null,
  end: string | Date | null,
): { current: number; total: number } | null => {
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const now = Date.now();
  if (!s || !e) return null;
  const totalDays = Math.max(1, Math.round((e - s) / 86400000));
  const elapsed = Math.max(0, Math.round((now - s) / 86400000));
  const totalWeeks = Math.max(1, Math.round(totalDays / 7));
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.ceil(elapsed / 7) || 1));
  return { current: currentWeek, total: totalWeeks };
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);

const dateOnly = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  if (typeof d === "string") return d.length >= 10 ? d.slice(0, 10) : d;
  return d.toISOString().slice(0, 10);
};

const iso = (d: Date | string | null | undefined): string | null => {
  if (!d) return null;
  if (typeof d === "string") return d;
  return d.toISOString();
};

// Serializers translate Prisma model rows -> wire shape used by clients.
// Field names stay snake_case to minimize churn in existing client components.

export function serializeClient(c: any) {
  return {
    id: c.id,
    full_name: c.fullName,
    business_name: c.businessName ?? null,
    niche: c.niche ?? null,
    target_audience: c.targetAudience ?? null,
    platforms: c.platforms ?? [],
    content_pillars: c.contentPillars ?? [],
    tone: c.tone ?? null,
    goals: c.goals ?? null,
    avoid: c.avoid ?? null,
    start_date: dateOnly(c.startDate),
    end_date: dateOnly(c.endDate),
    retainer_amount: Number(c.retainerAmount ?? 0),
    notes: c.notes ?? null,
    archived: Boolean(c.archived),
    status: c.status ?? "green",
  };
}

export function serializeTask(t: any) {
  return {
    id: t.id,
    title: t.title,
    due_date: dateOnly(t.dueDate),
    tag: t.tag ?? null,
    client_id: t.clientId ?? null,
    completed: Boolean(t.completed),
    completed_at: iso(t.completedAt),
    sort_order: t.sortOrder ?? 0,
    source: t.source ?? "manual",
    source_ref: t.sourceRef ?? null,
    client_name: t.client?.fullName ?? null,
  };
}

export function serializeProspect(p: any) {
  return {
    id: p.id,
    full_name: p.fullName,
    platform: p.platform ?? null,
    niche: p.niche ?? null,
    deal_value: Number(p.dealValue ?? 0),
    stage: p.stage,
    stage_entered_at: iso(p.stageEnteredAt)!,
    date_added: iso(p.dateAdded)!,
    next_follow_up: dateOnly(p.nextFollowUp),
    next_action: p.nextAction ?? null,
    lead_source: p.leadSource ?? null,
    converted_client_id: p.convertedClientId ?? null,
    sort_order: p.sortOrder ?? 0,
  };
}

export function serializeProspectNote(n: any) {
  return {
    id: n.id,
    prospect_id: n.prospectId,
    body: n.body,
    created_at: iso(n.createdAt)!,
  };
}

export function serializeContent(ci: any) {
  return {
    id: ci.id,
    client_id: ci.clientId,
    title: ci.title,
    platform: ci.platform ?? null,
    format: ci.format ?? null,
    status: ci.status,
    scheduled_date: dateOnly(ci.scheduledDate),
    script: ci.script ?? null,
    notes: ci.notes ?? null,
    post_link: ci.postLink ?? null,
    perf_views: ci.perfViews ?? null,
    perf_likes: ci.perfLikes ?? null,
    perf_comments: ci.perfComments ?? null,
    perf_saves: ci.perfSaves ?? null,
    assignee_id: ci.assigneeId ?? null,
    due_date: dateOnly(ci.dueDate),
    in_production: Boolean(ci.inProduction),
    production_stage: ci.productionStage,
    sort_order: ci.sortOrder ?? 0,
    client_name: ci.client?.fullName,
    assignee_name: ci.assignee?.name ?? null,
  };
}

export function serializeResource(r: any) {
  return {
    id: r.id,
    client_id: r.clientId,
    title: r.title,
    type: r.type ?? null,
    url: r.url ?? null,
    description: r.description ?? null,
  };
}

export function serializeInvoice(i: any) {
  return {
    id: i.id,
    client_id: i.clientId,
    amount: Number(i.amount ?? 0),
    issue_date: dateOnly(i.issueDate),
    due_date: dateOnly(i.dueDate),
    status: i.status,
    payment_method: i.paymentMethod ?? null,
    notes: i.notes ?? null,
    paid_at: iso(i.paidAt),
    client_name: i.client?.fullName,
  };
}

export function serializeUser(p: any) {
  return {
    id: p.id,
    email: p.email,
    name: p.name,
    role: p.role,
    assigned_client_ids: p.assignedClientIds ?? [],
  };
}
