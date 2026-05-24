import { Database, Info } from "lucide-react";
import { Badge, Panel } from "@/components/ui";
import type { OpportunityDataResult } from "@/lib/opportunity-data";

export function DataSourceBanner({ data }: { data: Pick<OpportunityDataResult, "source" | "label" | "message" | "generatedAt"> }) {
  const tone = data.source === "secop" ? "success" : data.source === "fallback" ? "warning" : "info";

  return (
    <Panel className="mb-6 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-stone-100 p-2 text-steel">
            {data.source === "secop" ? <Database className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Fuente de datos</h2>
              <Badge tone={tone}>{data.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-stone-600">{data.message}</p>
          </div>
        </div>
        <div className="text-xs text-stone-500">Actualizado {new Date(data.generatedAt).toLocaleString("es-CO")}</div>
      </div>
    </Panel>
  );
}
