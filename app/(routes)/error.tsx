"use client";

import { useEffect } from "react";

import { Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import StatusPage from "@shared/components/StatusPage";

// Error inesperado al mostrar una página del sistema. Se muestra dentro del
// layout (con el menú), en lugar de dejar la pantalla en blanco.
export default function RoutesError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={<ErrorOutlineIcon />}
      title="No se pudo mostrar esta página"
      description="Ocurrió un error inesperado. Intente de nuevo; si el problema continúa, avise al administrador del sistema."
    >
      <Button variant="contained" startIcon={<RefreshIcon />} onClick={retry}>
        Reintentar
      </Button>
      <Button variant="outlined" href="/dashboard">
        Ir al inicio
      </Button>
    </StatusPage>
  );
}
