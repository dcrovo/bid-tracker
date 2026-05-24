import { AppShell } from "@/components/app-shell";
import { DataSourceBanner } from "@/components/data-source-banner";
import { Badge, Panel } from "@/components/ui";
import { shortDate } from "@/lib/format";
import { getOpportunityData } from "@/lib/opportunity-data";

export default async function CalendarPage() {
  const data = await getOpportunityData(40);
  const opportunities = data.opportunities;

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Plazos</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Calendario</h1>
      </div>
      <DataSourceBanner data={data} />
      <Panel>
        <div className="space-y-4">
          {opportunities.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 border-b border-stone-100 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 text-sm text-stone-600">{item.entity}</div>
              </div>
              <Badge tone="warning">Cierre {shortDate(item.deadline)}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
