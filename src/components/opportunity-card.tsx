import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin } from "lucide-react";
import { Badge, Panel, ScoreRing } from "@/components/ui";
import { daysUntil, deadlineHealth, money, shortDate } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const health = deadlineHealth(opportunity.deadline);
  const tone = health === "urgente" ? "danger" : health === "proximo" ? "warning" : health === "vencido" ? "neutral" : "success";

  return (
    <Panel className="p-4 transition hover:border-amber/60">
      <div className="flex gap-4">
        <ScoreRing score={opportunity.fitScore.score} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={opportunity.fitScore.level === "Alto" ? "success" : opportunity.fitScore.level === "Medio" ? "warning" : "danger"}>
              {opportunity.fitScore.level}
            </Badge>
            <Badge tone="info">{opportunity.modality}</Badge>
            <Badge>{opportunity.status}</Badge>
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-semibold text-ink">{opportunity.title}</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-600">
            <span>{opportunity.entity}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {opportunity.municipality}, {opportunity.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {shortDate(opportunity.deadline)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-stone-500">Cuantia estimada</div>
              <div className="font-semibold">{money(opportunity.estimatedValue)}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={tone}>{daysUntil(opportunity.deadline)} dias</Badge>
              <Link className="focus-ring rounded-md bg-coal px-3 py-2 text-sm font-semibold text-white" href={`/opportunities/${opportunity.id}`}>
                <span className="inline-flex items-center gap-2">
                  Ver <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
