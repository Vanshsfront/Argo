"use client";
import { useState } from "react";
import type { Client } from "@/lib/types";
import ClientAbout from "./ClientAbout";
import ContentCalendar from "./ContentCalendar";
import ClientResources from "./ClientResources";
import ClientTasks from "./ClientTasks";
import { PageContainer } from "./ui/PageContainer";
import { cn } from "@/lib/cn";

type Tab = "about" | "content" | "resources" | "tasks";

const TABS: { id: Tab; label: string }[] = [
  { id: "about", label: "About" },
  { id: "content", label: "Content Calendar" },
  { id: "resources", label: "Resources" },
  { id: "tasks", label: "Tasks" },
];

export default function ClientWorkspace({
  client,
  week,
  role,
}: {
  client: Client;
  week: { current: number; total: number } | null;
  role: "admin" | "team" | "viewer";
}) {
  const [tab, setTab] = useState<Tab>("about");
  const dotCls = client.status === "red" ? "dot-red" : client.status === "yellow" ? "dot-yellow" : "dot-green";

  return (
    <PageContainer
      title={
        <span className="flex items-center gap-3">
          {client.full_name}
          <span className={cn("dot", dotCls)} />
        </span>
      }
      description={
        <>
          {client.business_name || client.niche || "Client workspace"}
          {week && <span> · Week {week.current} of {week.total}</span>}
        </>
      }
    >
      <div className="mb-5 overflow-x-auto scrollbar-hide">
        <div className="tab-list">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("tab whitespace-nowrap", tab === t.id && "tab-active")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "about" && <ClientAbout client={client} role={role} />}
      {tab === "content" && <ContentCalendar clientId={client.id} />}
      {tab === "resources" && <ClientResources clientId={client.id} role={role} />}
      {tab === "tasks" && <ClientTasks clientId={client.id} />}
    </PageContainer>
  );
}
