export interface GembaWalkObserver {
  id: number;
  isActive: boolean;
  manufacturingPlant: {
    id: number;
    name: string;
  };
  gembaWalkZone: {
    id: number;
    nameZone: string;
    nameLocation: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
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
