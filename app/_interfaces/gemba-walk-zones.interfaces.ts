export interface GembaWalkZone {
  id: number;
  nameZone: string;
  nameLocation: string;
  isActive: boolean;
  manufacturingPlant: {
    id: number;
    name: string;
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
