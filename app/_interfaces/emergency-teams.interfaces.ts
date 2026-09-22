export enum ExtinguisherType {
  PQS = "PQS",
  CO2 = "CO2",
  AFFF = "AFFF",
  EXTINTOR_TIPO_D = "Extintor tipo D",
  EXTINTOR_DE_SOLKAFLAN = "Extintor de Solkaflan",
}

export interface EmergencyTeam {
  id: number;
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: number;
  manufacturingPlant: EmergencyTeamManufacturingPlant;
  isActive: boolean;
  createdBy: EmergencyTeamUser;
  updatedBy: EmergencyTeamUser | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmergencyTeamManufacturingPlant {
  id: number;
  name: string;
}

interface EmergencyTeamUser {
  id: number;
  name: string;
  email: string;
}
