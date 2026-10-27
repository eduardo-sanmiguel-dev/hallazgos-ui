import { ReactNode } from "react";

import { Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import RefreshIcon from "@mui/icons-material/Refresh";

import EmptyState from "./EmptyState";

interface ErrorStateProps {
  title?: string;
  description?: ReactNode;
  // Con `onRetry` aparece el botón "Reintentar".
  onRetry?: () => void;
  isRetrying?: boolean;
  // Sin conexión cambia el ícono y el texto por omisión.
  offline?: boolean;
  size?: "small" | "medium";
  // Acciones extra junto a "Reintentar".
  children?: ReactNode;
}

// Una consulta falló: distingue "no se pudo cargar" de "no hay datos".
export default function ErrorState({
  title,
  description,
  onRetry,
  isRetrying = false,
  offline = false,
  size = "medium",
  children,
}: ErrorStateProps) {
  return (
    <EmptyState
      role="alert"
      tone={offline ? "warning" : "error"}
      size={size}
      icon={offline ? <CloudOffIcon /> : <ErrorOutlineIcon />}
      title={title ?? (offline ? "Sin conexión" : "No se pudo cargar")}
      description={
        description ??
        (offline
          ? "Revisa tu señal o tu red e inténtalo de nuevo."
          : "Ocurrió un problema al consultar la información.")
      }
    >
      {onRetry && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          loading={isRetrying}
        >
          Reintentar
        </Button>
      )}
      {children}
    </EmptyState>
  );
}
