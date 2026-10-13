// Mismo listado que la API (gemba-walk-evaluation-categories.ts), en el orden
// en que se muestran en el recorrido.
export const GEMBA_WALK_EVALUATION_CATEGORIES = ["SHE", "CALIDAD"] as const;

export type GembaWalkEvaluationCategory =
  (typeof GEMBA_WALK_EVALUATION_CATEGORIES)[number];

export interface GembaWalkEvaluation {
  id: number;
  area: string;
  category: GembaWalkEvaluationCategory;
  description: string;
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
