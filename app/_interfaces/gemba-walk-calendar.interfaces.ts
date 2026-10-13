export interface GembaWalkCalendar {
  id: number;
  scheduledAt: string;
  isAdditional: boolean;
  isActive: boolean;
  gembaWalkZone: {
    id: number;
    nameZone: string;
    nameLocation: string;
    manufacturingPlant: {
      id: number;
      name: string;
    };
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
