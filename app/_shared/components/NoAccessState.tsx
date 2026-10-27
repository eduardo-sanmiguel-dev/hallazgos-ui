import { ReactNode } from "react";

import Link from "next/link";

import { Button } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import EmptyState from "./EmptyState";

interface NoAccessStateProps {
  title?: string;
  description?: ReactNode;
  // Destino del botón; con "" no se muestra.
  homeHref?: string;
  homeLabel?: string;
}

// La página existe, pero el usuario no tiene permiso para verla. Solo
// informa: los permisos los decide el API en cada petición.
export default function NoAccessState({
  title = "No tienes acceso a esta sección",
  description = "Si necesitas usarla, pide acceso a un administrador.",
  homeHref = "/dashboard",
  homeLabel = "Ir al inicio",
}: NoAccessStateProps) {
  return (
    <EmptyState
      role="alert"
      tone="warning"
      icon={<LockOutlinedIcon />}
      title={title}
      description={description}
    >
      {homeHref && (
        <Button variant="contained" component={Link} href={homeHref}>
          {homeLabel}
        </Button>
      )}
    </EmptyState>
  );
}
