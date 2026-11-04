import { ReactNode } from "react";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import NoAccessState from "@shared/components/NoAccessState";
import { useGembaWalkAccessQuery } from "@hooks/useGembaWalkAccess";

// La API valida el acceso en cada petición; esto solo evita mostrar la página
// a quien no es observador. Con `title`, la página dibuja su propia cabecera
// (con sus botones) y aquí solo se muestra mientras se verifica o si se niega.
export default function GembaWalkAccessGuard({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  // Mientras se verifica, null; si falla, sin acceso.
  const access = useGembaWalkAccessQuery();
  const isObserver = access.isError ? false : (access.data ?? null);

  const header = title ? <PageHeader title={title} /> : null;

  if (isObserver === null) {
    return (
      <>
        {header}
        <LoadingLinear />
      </>
    );
  }

  if (!isObserver) {
    return (
      <>
        {header}
        <NoAccessState description="Solo los usuarios registrados como observadores de Gemba Walk o los administradores pueden acceder a este módulo." />
      </>
    );
  }

  return <>{children}</>;
}
