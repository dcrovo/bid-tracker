import { describe, expect, it, vi } from "vitest";
import { camodProfile } from "@/lib/company-profile";
import { scoreOpportunity } from "@/lib/scoring";
import type { Opportunity } from "@/lib/types";

const baseOpportunity: Omit<Opportunity, "fitScore"> = {
  id: "test-1",
  source: "SECOP II",
  sourceId: "CO1.TEST",
  title: "Interventoria tecnica para obra de infraestructura educativa",
  entity: "Gobernacion de Caldas",
  department: "Caldas",
  municipality: "Manizales",
  modality: "Concurso de meritos",
  contractType: "Consultoria",
  estimatedValue: 900000000,
  publicationDate: "2026-05-20T00:00:00.000Z",
  deadline: "2026-06-10T00:00:00.000Z",
  status: "Nuevo",
  processState: "Publicado",
  officialUrl: "https://example.com",
  keywords: ["interventoria", "obra", "infraestructura"],
  documents: []
};

describe("scoreOpportunity", () => {
  it("scores a strong CAMOD match as high", () => {
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    const result = scoreOpportunity(baseOpportunity, camodProfile);

    expect(result.score).toBeGreaterThanOrEqual(72);
    expect(result.level).toBe("Alto");
    expect(result.reasons.join(" ")).toContain("Caldas");
    vi.useRealTimers();
  });

  it("penalizes excluded procurement categories", () => {
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    const result = scoreOpportunity(
      {
        ...baseOpportunity,
        title: "Suministro de alimentos para programa institucional",
        contractType: "Suministro",
        keywords: ["suministro de alimentos"]
      },
      camodProfile
    );

    expect(result.level).toBe("Bajo");
    expect(result.risks.some((risk) => risk.includes("terminos excluidos"))).toBe(true);
    vi.useRealTimers();
  });

  it("penalizes expired opportunities", () => {
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    const result = scoreOpportunity({ ...baseOpportunity, deadline: "2026-05-01T00:00:00.000Z" }, camodProfile);

    expect(result.risks).toContain("El plazo de presentacion ya vencio.");
    expect(result.score).toBeLessThan(90);
    vi.useRealTimers();
  });
});
