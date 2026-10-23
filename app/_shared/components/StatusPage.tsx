"use client";

import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Typography } from "@mui/material";

interface StatusPageProps {
  code?: string;
  title: string;
  description: ReactNode;
  icon: ReactNode;
  // Botones de acción (Reintentar, Ir al inicio...).
  children?: ReactNode;
}

// Pantalla completa para errores y páginas no encontradas.
export default function StatusPage({
  code,
  title,
  description,
  icon,
  children,
}: StatusPageProps) {
  return (
    <Box
      component="section"
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 2,
        px: 2,
        py: 6,
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 72,
          height: 72,
          bgcolor: "action.hover",
          color: "text.secondary",
          "& svg": { fontSize: 36 },
          // Es la pantalla de error: puede mostrarse sin el tema de la app
          // (p. ej. un error al renderizar el layout); 16 = tokens.radius.xl.
          borderRadius: theme.tokens?.radius.xl ?? 16,
        })}
      >
        {icon}
      </Box>
      {code && (
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1 }}
        >
          {code}
        </Typography>
      )}
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontSize: { xs: "1.625rem", sm: "2.125rem" } }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: "text.secondary", maxWidth: 480 }}>
        {description}
      </Typography>
      {children && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1,
            mt: 1,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
