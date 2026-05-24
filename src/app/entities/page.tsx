import { AppShell } from "@/components/app-shell";
import { DataSourceBanner } from "@/components/data-source-banner";
import { Panel } from "@/components/ui";
import { money } from "@/lib/format";
import { getOpportunityData } from "@/lib/opportunity-data";

export default async function EntitiesPage() {
  const data = await getOpportunityData(60);
  const byEntity = new Map<string, { department: string; count: number; value: number }>();

  for (const item of data.opportunities) {
    const current = byEntity.get(item.entity) ?? { department: item.department, count: 0, value: 0 };
    current.count += 1;
    current.value += item.estimatedValue;
    byEntity.set(item.entity, current);
  }

  const entities = Array.from(byEntity.entries()).sort((a, b) => b[1].value - a[1].value);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">Inteligencia</div>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Entidades</h1>
      </div>
      <DataSourceBanner data={data} />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-stone-200 text-xs uppercase text-stone-500">
              <tr>
                <th className="py-3">Entidad</th>
                <th>Departamento</th>
                <th>Procesos</th>
                <th>Valor potencial</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(([entity, stats]) => (
                <tr key={entity} className="border-b border-stone-100">
                  <td className="py-4 font-semibold">{entity}</td>
                  <td>{stats.department}</td>
                  <td>{stats.count}</td>
                  <td>{money(stats.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
