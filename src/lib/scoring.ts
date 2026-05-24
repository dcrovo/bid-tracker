import type { CompanyProfile, FitScore, Opportunity } from "@/lib/types";

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function scoreOpportunity(
  opportunity: Omit<Opportunity, "fitScore">,
  profile: CompanyProfile
): FitScore {
  let score = 20;
  const reasons: string[] = [];
  const risks: string[] = [];
  const haystack = normalize(`${opportunity.title} ${opportunity.keywords.join(" ")} ${opportunity.contractType}`);

  const keywordMatches = profile.positiveKeywords.filter((keyword) => haystack.includes(normalize(keyword)));
  if (keywordMatches.length > 0) {
    score += Math.min(keywordMatches.length * 8, 32);
    reasons.push(`Coincide con ${keywordMatches.slice(0, 4).join(", ")}.`);
  }

  if (profile.targetDepartments.includes(opportunity.department)) {
    score += 16;
    reasons.push(`Ubicacion prioritaria: ${opportunity.department}.`);
  }

  if (profile.preferredModalities.includes(opportunity.modality)) {
    score += 12;
    reasons.push(`Modalidad compatible: ${opportunity.modality}.`);
  }

  if (opportunity.estimatedValue >= profile.minValue && opportunity.estimatedValue <= profile.maxValue) {
    score += 14;
    reasons.push("Cuantia dentro del rango objetivo de CAMOD.");
  } else {
    risks.push("Cuantia fuera del rango objetivo definido.");
  }

  const excluded = profile.excludedKeywords.filter((keyword) => haystack.includes(normalize(keyword)));
  if (excluded.length > 0) {
    score -= 35;
    risks.push(`Contiene terminos excluidos: ${excluded.join(", ")}.`);
  }

  const deadline = new Date(opportunity.deadline).getTime();
  const now = Date.now();
  const days = Math.ceil((deadline - now) / 86400000);
  if (days < 0) {
    score -= 25;
    risks.push("El plazo de presentacion ya vencio.");
  } else if (days <= 3) {
    score -= 12;
    risks.push("Plazo muy corto para preparar propuesta.");
  } else {
    reasons.push(`Quedan ${days} dias para decidir y preparar.`);
  }

  const bounded = Math.max(0, Math.min(100, score));
  return {
    score: bounded,
    level: bounded >= 72 ? "Alto" : bounded >= 45 ? "Medio" : "Bajo",
    reasons: reasons.length ? reasons : ["Requiere revision manual del equipo."],
    risks
  };
}
