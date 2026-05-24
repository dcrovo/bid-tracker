"use client";

import { useState } from "react";
import { OpportunityAiPanel } from "@/components/opportunity-ai-panel";
import { OpportunityDocumentsPanel } from "@/components/opportunity-documents-panel";
import type { OpportunityAiAnalysis } from "@/lib/types";

export function OpportunityDetailClient({ opportunityId }: { opportunityId: string }) {
  const [analysis, setAnalysis] = useState<OpportunityAiAnalysis | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <>
      <OpportunityDocumentsPanel opportunityId={opportunityId} onAnalysis={(nextAnalysis, nextStatus) => { setAnalysis(nextAnalysis); setStatus(nextStatus); }} />
      <OpportunityAiPanel opportunityId={opportunityId} analysis={analysis} status={status} />
    </>
  );
}
