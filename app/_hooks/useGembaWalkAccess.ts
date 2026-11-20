import { useQuery } from "@tanstack/react-query";

import { GembaWalksService } from "@services";
import { useUserSessionStore } from "@store";

/**
 * ¿El usuario es observador de Gemba Walk? true/false, o null mientras se
 * verifica. Lo trae el usuario en sesión (`isGembaWalkObserver`); antes se
 * pedía aparte en cada carga. Solo con un API anterior, sin ese dato, se
 * pregunta a GET /gemba-walk/walks/access (una sola petición, compartida por
 * el menú, la navegación inferior y el guardia del módulo). Si falla, "no":
 * el módulo se oculta (el API valida cada petición de todos modos).
 */
export function useGembaWalkAccessState(): boolean | null {
  const userId = useUserSessionStore((state) => state.id);
  const fromSession = useUserSessionStore((state) => state.isGembaWalkObserver);

  const query = useQuery({
    queryKey: ["gemba-walk-access", userId],
    queryFn: async () => (await GembaWalksService.access()).isObserver,
    staleTime: 5 * 60 * 1000,
    enabled: fromSession === undefined,
  });

  if (fromSession !== undefined) return fromSession;
  if (query.isError) return false;
  return query.data ?? null;
}

/** Como useGembaWalkAccessState, pero "no" mientras se verifica. */
export function useGembaWalkAccess() {
  return useGembaWalkAccessState() ?? false;
}
