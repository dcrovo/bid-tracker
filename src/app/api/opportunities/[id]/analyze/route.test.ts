import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/opportunity-data", () => ({
  getOpportunityById: vi.fn(async () => ({
    opportunity: {
      id: "test-id",
      source: "SECOP II",
      sourceId: "CO1.TEST",
      title: "Obra de infraestructura educativa",
      entity: "Entidad",
      department: "Caldas",
      municipality: "Manizales",
      modality: "Licitacion publica",
      contractType: "Obra",
      estimatedValue: 100000000,
      publicationDate: "2026-05-24T00:00:00.000Z",
      deadline: "2026-06-24T00:00:00.000Z",
      status: "Nuevo",
      processState: "Publicado",
      officialUrl: "https://example.com",
      keywords: ["V1.72101500", "obra"],
      documents: [],
      fitScore: { score: 80, level: "Alto", reasons: ["Coincide"], risks: [] }
    }
  }))
}));

vi.mock("@/lib/opportunity-ai", () => ({
  analyzeOpportunityWithOpenAI: vi.fn(async () => ({
    executiveSummary: "Resumen",
    recommendation: "Revisar primero",
    recommendationReasons: ["Razon"],
    requiredDocuments: [],
    habilitatingRequirements: { juridicos: [], financieros: [], tecnicos: [], organizacionales: [] },
    unspscCodes: [],
    requiredTeam: [],
    requiredExperience: [],
    risks: [],
    nextActions: [],
    limitations: []
  }))
}));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServiceClient: vi.fn(() => null)
}));

describe("/api/opportunities/[id]/analyze", () => {
  it("returns structured analysis from POST", async () => {
    const response = await POST(new Request("http://localhost"), { params: Promise.resolve({ id: "CO1.TEST" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.analysis.executiveSummary).toBe("Resumen");
    expect(body.opportunityId).toBe("CO1.TEST");
  });

  it("returns not found for saved analysis GET when Supabase is not configured", async () => {
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ id: "CO1.TEST" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.found).toBe(false);
  });
});
