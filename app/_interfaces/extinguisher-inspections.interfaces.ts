import { ExtinguisherType } from "./emergency-teams.interfaces";

export enum EvaluationValues {
  C = "C",
  NC = "NC",
  NA = "NA",
}

export interface ExtinguisherInspectionEvaluation {
  id: number;
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: number;
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
  nextRechargeDate: string;
  maintenanceDate: string;
  observations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtinguisherInspection {
  id: number;
  inspectionDate: string;
  isActive: boolean;
  responsible: {
    id: number;
    name: string;
    email: string;
  };
  manufacturingPlant: {
    id: number;
    name: string;
  };
  evaluations: ExtinguisherInspectionEvaluation[];
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
