import { Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataSourceBanner } from "@/components/data-source-banner";
import { OpportunityCard } from "@/components/opportunity-card";
import { Badge, Panel } from "@/components/ui";
import { getOpportunityData } from "@/lib/opportunity-data";

export default async function OpportunitiesPage() {
  const data = await getOpportunityData(60);
  const opportunities = data.opportunities;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Busqueda</div>
        <h1 className="text-3xl font-semibold text-ink">Oportunidades</h1>
      </div>

      <DataSourceBanner data={data} />

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-stone-500" />
          {["Obra", "Consultoria", "Interventoria", "Arquitectura", "Alto encaje", "SECOP II"].map((filter) => (
            <button key={filter} className="focus-ring rounded-md border border-stone-200 px-3 py-2 text-sm hover:bg-stone-50">
              {filter}
            </button>
          ))}
          <Badge tone="info">{opportunities.length} procesos</Badge>
        </div>
      </Panel>

      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </AppShell>
  );
}
