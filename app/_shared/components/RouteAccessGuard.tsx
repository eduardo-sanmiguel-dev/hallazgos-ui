"use client";

import { ReactNode, useEffect, useSyncExternalStore } from "react";

import { usePathname, useRouter } from "next/navigation";

import { useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import {
  canAccessPath,
  firstAccessiblePath,
  type RouteAccessContext,
} from "./menu";
import LoadingLinear from "./LoadingLinear";
import NoAccessState from "./NoAccessState";

const noopSubscribe = () => () => {};

// La sesión vive en sessionStorage: en el servidor no existe. Hasta montar en
// el navegador se pinta lo mismo que en el servidor (evita el error de
// hidratación).
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

// Bloquea las páginas que el menú no le muestra al usuario (entrar por URL
// directa) con un "sin acceso" en vez de una pantalla vacía o con errores.
// No cambia permisos: el API sigue validando cada petición.
export default function RouteAccessGuard({
  children,
}: {
  children: ReactNode;
}) {
  const isClient = useIsClient();
  const pathname = usePathname();
  const router = useRouter();

  const userId = useUserSessionStore((state) => state.id);
  const role = useUserSessionStore((state) => state.role);
  const email = useUserSessionStore((state) => state.email);

  const ctx: RouteAccessContext = {
    isAdmin: role === ROLE_ADMINISTRADOR,
    email,
    // Gemba Walk consulta si el usuario es observador; esa validación la hace
    // la propia página (GembaWalkAccessGuard), así que aquí se deja pasar.
    isGembaWalkObserver: true,
  };

  const isReady = isClient && !!userId;
  const allowed = isReady && canAccessPath(pathname, ctx);
  // El dashboard es el inicio tras el login: quien no lo ve va a su primera
  // página disponible en lugar de quedarse en un "sin acceso".
  const redirectHome = isReady && !allowed && pathname === "/dashboard";
  const home = firstAccessiblePath(ctx);

  useEffect(() => {
    if (redirectHome) router.replace(home);
  }, [redirectHome, home, router]);

  if (!isReady || redirectHome) {
    // La marca permite a las pruebas esperar a que termine la verificación.
    return (
      <div data-route-access="pending">
        <LoadingLinear />
      </div>
    );
  }

  if (!allowed) return <NoAccessState homeHref={home} />;

  return <>{children}</>;
}
