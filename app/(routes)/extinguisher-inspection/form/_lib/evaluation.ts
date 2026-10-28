import { EmergencyTeam, EvaluationValues, ExtinguisherType } from "@interfaces";

export type GroupedConceptKey =
  | "pressureManometer"
  | "valve"
  | "hose"
  | "cylinder"
  | "barrette"
  | "seal"
  | "cornet"
  | "access"
  | "support"
  | "signaling";

export type GroupedConceptStatus = EvaluationValues.NC | EvaluationValues.NA;

export interface EvaluationNoveltyRecord {
  conceptKey: GroupedConceptKey;
  status: GroupedConceptStatus;
}

export interface LocalEvaluation {
  emergencyTeamId: number;
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: string;
  pressureManometer: EvaluationValues;
  valve: EvaluationValues;
  hose: EvaluationValues;
  cylinder: EvaluationValues;
  barrette: EvaluationValues;
  seal: EvaluationValues;
  cornet: EvaluationValues;
  access: EvaluationValues;
  support: EvaluationValues;
  signaling: EvaluationValues;
  noveltyRecords: EvaluationNoveltyRecord[];
  observations: string;
  newNoveltyConcept: GroupedConceptKey | "";
  newNoveltyStatus: GroupedConceptStatus | "";
}

export const groupedConceptFields: Array<{
  key: GroupedConceptKey;
  label: string;
}> = [
  { key: "pressureManometer", label: "Manómetro" },
  { key: "valve", label: "Válvula" },
  { key: "hose", label: "Manguera" },
  { key: "cylinder", label: "Cilindro" },
  { key: "barrette", label: "Pasador" },
  { key: "seal", label: "Sello" },
  { key: "cornet", label: "Corneta" },
  { key: "access", label: "Acceso" },
  { key: "support", label: "Soporte" },
  { key: "signaling", label: "Señalización" },
];

export const groupedStatusValues: GroupedConceptStatus[] = [
  EvaluationValues.NC,
  EvaluationValues.NA,
];

export const statusLegendMap: Record<EvaluationValues, string> = {
  [EvaluationValues.C]: "C: CUMPLE",
  [EvaluationValues.NC]: "NC: NO CUMPLE",
  [EvaluationValues.NA]: "NA: No Aplica",
};
export const groupedConceptLabelMap = groupedConceptFields.reduce(
  (acc, field) => {
    acc[field.key] = field.label;
    return acc;
  },
  {} as Record<GroupedConceptKey, string>,
);

export const DUPLICATE_EVALUATION_TOAST_ID = "duplicate-evaluation";

export const getDefaultEvaluationFromEmergencyTeam = (
  emergencyTeam: EmergencyTeam,
): LocalEvaluation => ({
  emergencyTeamId: emergencyTeam.id,
  location: emergencyTeam.location,
  extinguisherNumber: emergencyTeam.extinguisherNumber.toString(),
  typeOfExtinguisher: emergencyTeam.typeOfExtinguisher,
  capacity: emergencyTeam.capacity.toString(),
  pressureManometer: EvaluationValues.C,
  valve: EvaluationValues.C,
  hose: EvaluationValues.C,
  cylinder: EvaluationValues.C,
  barrette: EvaluationValues.C,
  seal: EvaluationValues.C,
  cornet: EvaluationValues.C,
  access: EvaluationValues.C,
  support: EvaluationValues.C,
  signaling: EvaluationValues.C,
  noveltyRecords: [],
  observations: "",
  newNoveltyConcept: "",
  newNoveltyStatus: "",
});

// Límite del API para las observaciones de cada evaluación.
export const OBSERVATIONS_MAX_LENGTH = 500;

// Etiquetas de los campos de una evaluación, como se ven en la tarjeta.
const evaluationFieldLabels: Record<string, string> = {
  location: "Ubicación",
  extinguisherNumber: "N. Extintor",
  typeOfExtinguisher: "Tipo",
  capacity: "Capacidad",
  observations: "Observaciones generales",
  ...groupedConceptLabelMap,
};

// La fecha de próxima recarga es una sola para toda la inspección: sus
// errores van al campo de arriba, no a cada evaluación.
const SHARED_DATE_FIELDS = ["nextRechargeDate", "maintenanceDate"];

const EVALUATION_PATH = /^evaluations\.(\d+)\.(\w+)$/;

/**
 * Ruta de un error del API → campo del formulario (useFieldErrors). Los de
 * cada evaluación (`evaluations.0.capacity`) se muestran en su tarjeta con
 * evaluationApiErrors, así que aquí quedan fuera (null).
 */
export const inspectionApiField = (path: string) => {
  const match = path.match(EVALUATION_PATH);
  if (!match) return path === "evaluations" ? "evaluations" : path;
  return SHARED_DATE_FIELDS.includes(match[2])
    ? "sharedNextRechargeDate"
    : null;
};

/**
 * Errores del API por evaluación (índice en el formulario), con la etiqueta
 * del campo: "Capacidad: debe ser 1 o mayor.". El orden de las evaluaciones
 * del envío es el del formulario.
 */
export const evaluationApiErrors = (fieldErrors: Record<string, string>) => {
  const byEvaluation: Record<number, string[]> = {};
  for (const [path, message] of Object.entries(fieldErrors)) {
    const match = path.match(EVALUATION_PATH);
    if (!match || SHARED_DATE_FIELDS.includes(match[2])) continue;
    const label = evaluationFieldLabels[match[2]] ?? match[2];
    const text = message.charAt(0).toLowerCase() + message.slice(1);
    (byEvaluation[Number(match[1])] ??= []).push(`${label}: ${text}`);
  }
  return byEvaluation;
};
