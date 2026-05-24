import { AlertTriangle, CalendarDays, CircleDollarSign, MapPinned, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataSourceBanner } from "@/components/data-source-banner";
import { OpportunityCard } from "@/components/opportunity-card";
import { Badge, Panel } from "@/components/ui";
import { money } from "@/lib/format";
import { getOpportunityData } from "@/lib/opportunity-data";

export default async function DashboardPage() {
  const data = await getOpportunityData(30);
  const opportunities = data.opportunities;
  const highFit = opportunities.filter((item) => item.fitScore.score >= 70);
  const totalValue = opportunities.reduce((sum, item) => sum + item.estimatedValue, 0);
  const active = opportunities.filter((item) => item.status !== "Archivado");

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Panel operativo</div>
        <h1 className="text-3xl font-semibold text-ink">Oportunidades para construccion, arquitectura y consultoria</h1>
        <p className="max-w-3xl text-sm text-stone-600">
          Priorizacion de licitaciones publicas con enfoque en encaje CAMOD, plazos, cuantia y riesgo documental.
        </p>
      </div>

      <DataSourceBanner data={data} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TrendingUp} label="Alto encaje" value={String(highFit.length)} detail="Procesos para revisar primero" />
        <Metric icon={CircleDollarSign} label="Valor potencial" value={money(totalValue)} detail="Muestra inicial importada" />
        <Metric icon={CalendarDays} label="Procesos activos" value={String(active.length)} detail="Sin archivados" />
        <Metric icon={AlertTriangle} label="Alertas" value="3" detail="Plazos o documentos por revisar" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mejores oportunidades</h2>
            <Badge tone="success">Score CAMOD</Badge>
          </div>
          {opportunities
            .slice()
            .sort((a, b) => b.fitScore.score - a.fitScore.score)
            .slice(0, 3)
            .map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
        </div>

        <div className="space-y-6">
          <Panel>
            <div className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-steel" />
              <h2 className="font-semibold">Distribucion territorial</h2>
            </div>
            <div className="mt-5 space-y-4">
              {["Caldas", "Risaralda", "Antioquia", "Cundinamarca"].map((department, index) => (
                <div key={department}>
                  <div className="flex justify-between text-sm">
                    <span>{department}</span>
                    <span className="font-semibold">{Math.max(1, 4 - index)} procesos</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-steel" style={{ width: `${86 - index * 16}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <h2 className="font-semibold">Novedades recientes</h2>
            <div className="mt-4 space-y-4 text-sm">
              <Update title="Adenda publicada" detail="Revisar cambios de cronograma en proceso de placa huella." />
              <Update title="Nuevo proceso compatible" detail="Estudios y disenos arquitectonicos en Risaralda." />
              <Update title="Vence pronto" detail="Proceso archivado por bajo encaje y objeto fuera del foco." />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-stone-500">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-ink">{value}</div>
          <div className="mt-1 text-xs text-stone-500">{detail}</div>
        </div>
        <div className="rounded-md bg-amber/15 p-2 text-amber">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Panel>
  );
}

function Update({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="border-l-2 border-amber pl-3">
      <div className="font-semibold">{title}</div>
      <div className="text-stone-600">{detail}</div>
    </div>
  );
}
