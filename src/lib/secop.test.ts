import { describe, expect, it } from "vitest";
import { normalizeSecopProcess } from "@/lib/secop";

describe("normalizeSecopProcess", () => {
  it("normalizes SECOP rows into internal opportunities", () => {
    const opportunity = normalizeSecopProcess({
      id_proceso: "CO1.BDOS.TEST",
      descripcion_del_procedimiento: "Consultoria para estudios y disenos arquitectonicos",
      entidad: "Alcaldia de Manizales",
      departamento_entidad: "Caldas",
      ciudad_entidad: "Manizales",
      modalidad_de_contratacion: "Concurso de meritos",
      tipo_de_contrato: "Consultoria",
      precio_base: "1500000000",
      fecha_de_publicacion_del_proceso: "2026-05-20T00:00:00.000Z",
      fecha_de_recepcion_de_respuestas: "2026-06-20T00:00:00.000Z",
      estado_del_procedimiento: "Publicado",
      urlproceso: "https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?notice=test"
    });

    expect(opportunity.id).toBe("CO1.BDOS.TEST");
    expect(opportunity.source).toBe("SECOP II");
    expect(opportunity.entity).toBe("Alcaldia de Manizales");
    expect(opportunity.estimatedValue).toBe(1500000000);
    expect(opportunity.officialUrl).toContain("community.secop.gov.co");
    expect(opportunity.fitScore.score).toBeGreaterThan(0);
  });

  it("falls back to official SECOP search when urlproceso is absent", () => {
    const opportunity = normalizeSecopProcess({
      id_proceso: "CO1.BDOS.NOURL",
      descripcion_del_procedimiento: "Obra de infraestructura",
      fecha_de_recepcion_de_respuestas: "2026-06-20T00:00:00.000Z"
    });

    expect(opportunity.officialUrl).toContain("/Public/Tendering/ContractNoticeManagement/Index");
    expect(opportunity.officialUrl).toContain("searchText=CO1.BDOS.NOURL");
  });
});
