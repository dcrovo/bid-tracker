import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OpportunityDetailClient } from "@/components/opportunity-detail-client";
import { Badge } from "@/components/ui";
import { getOpportunityById } from "@/lib/opportunity-data";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOpportunityById(decodeURIComponent(id));
  const opportunity = data.opportunity;
  if (!opportunity) notFound();

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3">
        <Link href="/opportunities" className="text-sm font-semibold text-steel">
          Oportunidades
        </Link>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="info">{opportunity.source}</Badge>
              <Badge>{opportunity.processState}</Badge>
              <Badge tone={opportunity.fitScore.level === "Alto" ? "success" : "warning"}>{opportunity.fitScore.level}</Badge>
            </div>
            <h1 className="max-w-5xl text-3xl font-semibold text-ink">{opportunity.title}</h1>
            <p className="mt-3 text-stone-600">
              {opportunity.entity} · {opportunity.municipality}, {opportunity.department}
            </p>
          </div>
          <a className="focus-ring rounded-md bg-coal px-4 py-2 text-sm font-semibold text-white" href={opportunity.officialUrl} target="_blank">
            <span className="inline-flex items-center gap-2">
              Abrir fuente oficial <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <div className="space-y-6">
          <OpportunityDetailClient opportunityId={opportunity.sourceId} />
        </div>
      </div>
    </AppShell>
  );
}

