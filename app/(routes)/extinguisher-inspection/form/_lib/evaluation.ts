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
