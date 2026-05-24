import { camodProfile } from "@/lib/company-profile";
import { scoreOpportunity } from "@/lib/scoring";
import { secopSearchUrl } from "@/lib/secop-links";
import type { Opportunity } from "@/lib/types";

const baseOpportunities: Omit<Opportunity, "fitScore">[] = [
  {
    id: "SECOP-II-001",
    source: "SECOP II",
    sourceId: "CO1.BDOS.7128401",
    title: "Interventoria tecnica, administrativa y financiera para mejoramiento de infraestructura educativa",
    entity: "Gobernacion de Caldas",
    department: "Caldas",
    municipality: "Manizales",
    modality: "Concurso de meritos",
    contractType: "Consultoria",
    estimatedValue: 1240000000,
    publicationDate: "2026-05-16T10:00:00.000Z",
    deadline: "2026-06-03T21:00:00.000Z",
    status: "Interesante",
    processState: "Publicado",
    officialUrl: secopSearchUrl("CO1.BDOS.7128401"),
    keywords: ["interventoria", "infraestructura", "educativa", "consultoria", "Caldas"],
    documents: [
      {
        id: "doc-1",
        name: "Pliego de condiciones definitivo.pdf",
        type: "Pliego",
        url: "#",
        updatedAt: "2026-05-16T10:00:00.000Z"
      }
    ],
    aiSummary:
      "Proceso de interventoria para obras de mejoramiento en sedes educativas. Requiere experiencia especifica en supervision de obra publica y equipo profesional con perfiles tecnico, financiero y juridico.",
    requirements: [
      {
        category: "Experiencia",
        text: "Acreditar contratos de interventoria u obra civil educativa con valor acumulado comparable.",
        citation: "Pliego, seccion 3.2",
        risk: "Medio"
      },
      {
        category: "Cronograma",
        text: "Observaciones y subsanaciones con ventanas cortas; requiere responsable asignado.",
        citation: "Cronograma SECOP",
        risk: "Medio"
      }
    ]
  },
  {
    id: "SECOP-II-002",
    source: "SECOP II",
    sourceId: "CO1.BDOS.7131190",
    title: "Construccion de placa huella y obras de drenaje en via rural",
    entity: "Alcaldia Municipal de Salamina",
    department: "Caldas",
    municipality: "Salamina",
    modality: "Licitacion publica",
    contractType: "Obra",
    estimatedValue: 3820000000,
    publicationDate: "2026-05-14T13:00:00.000Z",
    deadline: "2026-05-28T22:00:00.000Z",
    status: "En revision",
    processState: "Publicado",
    officialUrl: secopSearchUrl("CO1.BDOS.7131190"),
    keywords: ["obra", "placa huella", "drenaje", "via rural", "infraestructura"],
    documents: [],
    aiSummary:
      "Obra publica rural con componentes de drenaje, concreto y manejo ambiental. El valor es relevante para consorcio o union temporal si la experiencia especifica excede el portafolio propio.",
    requirements: [
      {
        category: "Garantia",
        text: "Garantia de seriedad y amparos contractuales asociados a cumplimiento y estabilidad.",
        citation: "Minuta contractual, garantias",
        risk: "Bajo"
      }
    ]
  },
  {
    id: "SECOP-II-003",
    source: "SECOP II",
    sourceId: "CO1.BDOS.7125112",
    title: "Estudios y diseños arquitectonicos para centro cultural municipal",
    entity: "Alcaldia de Pereira",
    department: "Risaralda",
    municipality: "Pereira",
    modality: "Concurso de meritos",
    contractType: "Consultoria",
    estimatedValue: 690000000,
    publicationDate: "2026-05-17T08:00:00.000Z",
    deadline: "2026-06-10T21:00:00.000Z",
    status: "Nuevo",
    processState: "Publicado",
    officialUrl: secopSearchUrl("CO1.BDOS.7125112"),
    keywords: ["arquitectura", "diseño", "estudios", "centro cultural"],
    documents: [],
    aiSummary:
      "Consultoria de diseno arquitectonico con potencial alto para portafolio CAMOD. Requiere revisar exigencias de experiencia en equipamientos culturales.",
    requirements: []
  },
  {
    id: "SECOP-II-004",
    source: "SECOP II",
    sourceId: "CO1.BDOS.7119910",
    title: "Suministro de alimentos para programa institucional",
    entity: "Instituto Municipal",
    department: "Caldas",
    municipality: "La Dorada",
    modality: "Seleccion abreviada",
    contractType: "Suministro",
    estimatedValue: 420000000,
    publicationDate: "2026-05-12T08:00:00.000Z",
    deadline: "2026-05-23T21:00:00.000Z",
    status: "Archivado",
    processState: "Publicado",
    officialUrl: secopSearchUrl("CO1.BDOS.7119910"),
    keywords: ["suministro de alimentos", "programa", "institucional"],
    documents: [],
    aiSummary: "Proceso fuera del foco de CAMOD.",
    requirements: []
  }
];

export const opportunities: Opportunity[] = baseOpportunities.map((opportunity) => ({
  ...opportunity,
  fitScore: scoreOpportunity(opportunity, camodProfile)
}));
