import { useQuery } from "@tanstack/react-query";

import { GembaWalksService } from "@services";
import { useUserSessionStore } from "@store";

/**
 * Consulta "¿el usuario es observador de Gemba Walk?", compartida por el
 * menú lateral, la navegación inferior y el guardia de las páginas del
 * módulo (una sola petición).
 */
export function useGembaWalkAccessQuery() {
  const userId = useUserSessionStore((state) => state.id);

  return useQuery({
    queryKey: ["gemba-walk-access", userId],
    queryFn: async () => (await GembaWalksService.access()).isObserver,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * ¿El usuario es observador de Gemba Walk? Si falla, se toma como "no": el
 * módulo se oculta (el API valida cada petición de todos modos).
 */
export function useGembaWalkAccess() {
  const { data = false } = useGembaWalkAccessQuery();
  return data;
}
