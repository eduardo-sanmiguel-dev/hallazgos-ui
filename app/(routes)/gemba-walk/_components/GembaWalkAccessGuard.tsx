import { ReactNode, useEffect, useState } from "react";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import NoAccessState from "@shared/components/NoAccessState";
import { GembaWalksService } from "@services";

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
  const [isObserver, setIsObserver] = useState<boolean | null>(null);

  useEffect(() => {
    GembaWalksService.access()
      .then(({ isObserver }) => setIsObserver(isObserver))
      .catch(() => setIsObserver(false));
  }, []);

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
