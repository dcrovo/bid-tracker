import { AppShell } from "@/components/app-shell";
import { DataSourceBanner } from "@/components/data-source-banner";
import { Badge, Panel } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { getOpportunityData } from "@/lib/opportunity-data";
import type { OpportunityStatus } from "@/lib/types";

const stages: OpportunityStatus[] = ["Nuevo", "En revision", "Interesante", "En propuesta", "Presentado", "Adjudicado", "Perdido", "Archivado"];

export default async function PipelinePage() {
  const data = await getOpportunityData(40);
  const opportunities = data.opportunities;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Gestion</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Pipeline de licitaciones</h1>
      </div>
      <DataSourceBanner data={data} />
      <div className="grid gap-4 overflow-x-auto xl:grid-cols-4">
        {stages.map((stage) => {
          const items = opportunities.filter((item) => item.status === stage);
          return (
            <Panel key={stage} className="min-h-80 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">{stage}</h2>
                <Badge>{items.length}</Badge>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-md border border-stone-200 bg-white p-3">
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="mt-3 text-xs text-stone-600">{item.entity}</div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <Badge tone={item.fitScore.level === "Alto" ? "success" : "warning"}>{item.fitScore.score}</Badge>
                      <span>{shortDate(item.deadline)}</span>
                    </div>
                    <div className="mt-2 text-xs font-semibold">{money(item.estimatedValue)}</div>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
