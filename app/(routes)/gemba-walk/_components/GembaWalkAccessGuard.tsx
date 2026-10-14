import { ReactNode, useEffect, useState } from "react";

import { Alert } from "@mui/material";

import LoadingLinear from "@shared/components/LoadingLinear";
import { GembaWalksService } from "@services";

// La API valida el acceso en cada petición; esto solo evita mostrar la página
// a quien no es observador.
export default function GembaWalkAccessGuard({
  children,
}: {
  children: ReactNode;
}) {
  const [isObserver, setIsObserver] = useState<boolean | null>(null);

  useEffect(() => {
    GembaWalksService.access()
      .then(({ isObserver }) => setIsObserver(isObserver))
      .catch(() => setIsObserver(false));
  }, []);

  if (isObserver === null) return <LoadingLinear />;

  if (!isObserver) {
    return (
      <Alert severity="warning">
        Solo los usuarios registrados como observadores de Gemba Walk o los
        administradores pueden acceder a este módulo.
      </Alert>
    );
  }

  return <>{children}</>;
}
