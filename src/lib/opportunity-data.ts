import { unstable_noStore as noStore } from "next/cache";
import { opportunities as sampleOpportunities } from "@/lib/sample-data";
import { fetchSecopOpportunities } from "@/lib/secop";
import type { Opportunity } from "@/lib/types";

export type OpportunityDataResult = {
  source: "secop" | "sample" | "fallback";
  label: string;
  message: string;
  generatedAt: string;
  opportunities: Opportunity[];
};

export async function getOpportunityData(limit = 50): Promise<OpportunityDataResult> {
  noStore();

  try {
    const opportunities = await fetchSecopOpportunities(limit);
    if (opportunities.length > 0) {
      return {
        source: "secop",
        label: "SECOP en vivo",
        message: "Datos importados desde datos.gov.co / SECOP II.",
        generatedAt: new Date().toISOString(),
        opportunities
      };
    }
  } catch (error) {
    return {
      source: "fallback",
      label: "Demo con respaldo",
      message: error instanceof Error ? `SECOP no respondio correctamente: ${error.message}` : "SECOP no respondio correctamente.",
      generatedAt: new Date().toISOString(),
      opportunities: sampleOpportunities
    };
  }

  return {
    source: "sample",
    label: "Demo",
    message: "SECOP no devolvio resultados para el filtro actual.",
    generatedAt: new Date().toISOString(),
    opportunities: sampleOpportunities
  };
}

export async function getOpportunityById(id: string) {
  const data = await getOpportunityData(80);
  return {
    ...data,
    opportunity: data.opportunities.find((item) => item.id === id || item.sourceId === id) ?? sampleOpportunities.find((item) => item.id === id || item.sourceId === id)
  };
}
