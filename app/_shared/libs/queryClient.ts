import { QueryClient, isServer } from "@tanstack/react-query";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Datos "frescos" por 1 min: navegar entre pantallas no repite la
        // petición; pasado ese tiempo se revalidan en segundo plano.
        staleTime: 60 * 1000,
        // El interceptor de axios ya notifica cada error (toast) y maneja el
        // 401; reintentar mostraría el mismo error varias veces.
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * En el servidor un cliente por render (no se comparte caché entre
 * peticiones); en el navegador uno solo para toda la app, también accesible
 * desde los servicios para invalidar la caché tras una mutación.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
