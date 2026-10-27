import { useQuery } from "@tanstack/react-query";

import { GembaWalksService } from "@services";
import { useUserSessionStore } from "@store";

/**
 * ¿El usuario es observador de Gemba Walk? Una sola consulta compartida por el
 * menú lateral y la navegación inferior. Si falla, se toma como "no": el
 * módulo se oculta (el API valida cada petición de todos modos).
 */
export function useGembaWalkAccess() {
  const userId = useUserSessionStore((state) => state.id);

  const { data = false } = useQuery({
    queryKey: ["gemba-walk-access", userId],
    queryFn: async () => (await GembaWalksService.access()).isObserver,
    staleTime: 5 * 60 * 1000,
  });

  return data;
}
