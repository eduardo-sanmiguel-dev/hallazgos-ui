import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import type { User } from "@interfaces";
import { useUserSessionStore } from "@store";
import { getQueryClient } from "@shared/libs/queryClient";
import { loginPathFor, safeNextPath } from "@shared/utils/nextPath";
import { networkRetryDelay, retryNetworkErrors } from "@shared/utils/networkRetry";

// HttpOnly cookies stay with the browser. Nest validates identity and permissions.
export async function sessionLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    return redirect(url.pathname.replace(/\/+$/, "") + url.search);
  }
  if (url.pathname === "/privacy") return null;
  const apiUrl = import.meta.env.VITE_API_URL;
  const headers = { "Content-Type": "application/json", "x-app-key": import.meta.env.VITE_APP_KEY };
  const token = url.searchParams.get("token");
  if (url.pathname === "/" && token) {
    const response = await fetch(`${apiUrl}/auth/check-token-restore-password`, {
      method: "POST",
      headers,
      credentials: "include",
      signal: request.signal,
      body: JSON.stringify({ token }),
    });
    if (!response.ok || (await response.json()).statusCode) return redirect("/");
    return null;
  }
  const client = getQueryClient();
  const user = await client.fetchQuery({
    queryKey: ["authenticated-user"],
    staleTime: 60_000,
    // Un corte de red se reintenta solo (antes uno de medio segundo mostraba
    // "No se pudo mostrar esta página" y el usuario debía pulsar Reintentar).
    retry: retryNetworkErrors,
    retryDelay: networkRetryDelay,
    queryFn: async () => {
      const response = await fetch(`${apiUrl}/users/get-information-current-user`, {
        headers,
        credentials: "include",
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error("No se pudo verificar la sesión. Intenta de nuevo.");
      return (await response.json()) as User;
    },
  });
  if (request.signal.aborted) return null;
  const store = useUserSessionStore.getState();
  if (!user) {
    store.resetSession();
    if (url.pathname !== "/") return redirect(loginPathFor(url.pathname, url.search));
    return null;
  }
  const current = store.id === user.id ? store.manufacturingPlantsCurrent : [];
  store.setSession({
    ...user,
    manufacturingPlantsCurrent:
      user.manufacturingPlants.length === 1
        ? [user.manufacturingPlants[0].id]
        : current.filter((id) => user.manufacturingPlants.some((p) => p.id === id)),
  });
  client.setQueryData(["current-user"], user);
  if (url.pathname === "/")
    return redirect(safeNextPath(url.searchParams.get("next")) ?? "/dashboard");
  return null;
}
