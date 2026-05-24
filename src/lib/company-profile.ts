import type { CompanyProfile } from "@/lib/types";

export const camodProfile: CompanyProfile = {
  name: "CAMOD S.A.S.",
  services: [
    "construccion",
    "arquitectura",
    "consultoria",
    "interventoria",
    "diseño",
    "estudios",
    "obra civil",
    "mantenimiento"
  ],
  targetDepartments: ["Caldas", "Antioquia", "Risaralda", "Quindio", "Cundinamarca", "Valle del Cauca"],
  preferredModalities: ["Licitacion publica", "Concurso de meritos", "Seleccion abreviada", "Minima cuantia"],
  minValue: 80000000,
  maxValue: 6000000000,
  positiveKeywords: [
    "obra",
    "infraestructura",
    "consultoria",
    "interventoria",
    "arquitectura",
    "diseño",
    "estudios",
    "mejoramiento",
    "mantenimiento",
    "adecuacion",
    "construccion"
  ],
  excludedKeywords: ["suministro de alimentos", "vigilancia", "aseo hospitalario", "software", "combustible"]
};
