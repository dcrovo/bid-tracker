export type OpportunityStatus =
  | "Nuevo"
  | "En revision"
  | "Interesante"
  | "En propuesta"
  | "Presentado"
  | "Adjudicado"
  | "Perdido"
  | "Archivado";

export type DeadlineHealth = "vigente" | "proximo" | "urgente" | "vencido";

export type Opportunity = {
  id: string;
  source: "SECOP II" | "SECOP I" | "Manual";
  sourceId: string;
  title: string;
  entity: string;
  department: string;
  municipality: string;
  modality: string;
  contractType: string;
  estimatedValue: number;
  publicationDate: string;
  deadline: string;
  status: OpportunityStatus;
  processState: string;
  officialUrl: string;
  keywords: string[];
  documents: BidDocument[];
  aiSummary?: string;
  requirements?: Requirement[];
  fitScore: FitScore;
};

export type BidDocument = {
  id: string;
  opportunityId?: string;
  name: string;
  type: "Pliego" | "Adenda" | "Estudios previos" | "Informe" | "Otro";
  url: string;
  storagePath?: string | null;
  extractionStatus?: "pending" | "extracted" | "failed" | "unavailable";
  extractedText?: string | null;
  extractedAt?: string | null;
  extractionError?: string | null;
  updatedAt: string;
};

export type Requirement = {
  category: "Habilitante" | "Tecnico" | "Financiero" | "Experiencia" | "Garantia" | "Cronograma";
  text: string;
  citation: string;
  risk: "Bajo" | "Medio" | "Alto";
};

export type FitScore = {
  score: number;
  level: "Alto" | "Medio" | "Bajo";
  reasons: string[];
  risks: string[];
};

export type CompanyProfile = {
  name: string;
  services: string[];
  targetDepartments: string[];
  preferredModalities: string[];
  minValue: number;
  maxValue: number;
  positiveKeywords: string[];
  excludedKeywords: string[];
};

export type SecopProcessRow = Record<string, unknown>;


export type OpportunityAiAnalysis = {
  executiveSummary: string;
  recommendation: "Presentarse" | "Presentarse con aliado" | "Revisar primero" | "No presentarse";
  recommendationReasons: string[];
  requiredDocuments: Array<{
    name: string;
    status: "requerido" | "opcional" | "debe_verificarse_en_pliego";
    notes: string;
  }>;
  habilitatingRequirements: {
    juridicos: string[];
    financieros: string[];
    tecnicos: string[];
    organizacionales: string[];
  };
  unspscCodes: Array<{
    code: string;
    description: string;
    status: "detectado" | "debe_verificarse_en_pliego";
  }>;
  requiredTeam: Array<{
    role: string;
    profession: string;
    experience: string;
    dedication: string;
    documents: string[];
    status: "detectado" | "debe_verificarse_en_pliego";
  }>;
  requiredExperience: string[];
  risks: string[];
  nextActions: string[];
  limitations: string[];
};


export type DocumentAiContext = {
  documentId: string;
  name: string;
  type: string;
  sourceUrl: string;
  text: string;
};
