import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

export interface EmptyStateProps {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  // Acciones opcionales (por ejemplo, un botón "Crear").
  children?: ReactNode;
  size?: "small" | "medium";
  // Color del círculo del ícono. "neutral" para listas vacías; ErrorState y
  // NoAccessState usan los otros.
  tone?: "neutral" | "error" | "warning";
  // "alert" anuncia el mensaje al lector de pantalla (errores).
  role?: "status" | "alert";
}

// Mensaje para listas o tablas sin registros. Base visual de ErrorState y
// NoAccessState, para que los tres estados se vean igual.
export default function EmptyState({
  title = "Sin registros",
  description,
  icon = <InboxOutlinedIcon />,
  children,
  size = "medium",
  tone = "neutral",
  role,
}: EmptyStateProps) {
  const isSmall = size === "small";

  return (
    <Box
      role={role}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        py: isSmall ? 3 : 6,
        px: 2,
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: isSmall ? 40 : 56,
          height: isSmall ? 40 : 56,
          borderRadius: "50%",
          "& .MuiSvgIcon-root": { fontSize: isSmall ? 22 : 30 },
          ...(tone === "neutral"
            ? {
                color: "text.secondary",
                backgroundColor: theme.palette.action.hover,
              }
            : {
                color: theme.palette[tone].main,
                backgroundColor: alpha(
                  theme.palette[tone].main,
                  theme.palette.mode === "light" ? 0.1 : 0.2,
                ),
              }),
        })}
      >
        {icon}
      </Box>
      <Typography
        variant={isSmall ? "subtitle2" : "subtitle1"}
        component="p"
        sx={{ fontWeight: 600, color: "text.primary" }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", maxWidth: 480 }}
        >
          {description}
        </Typography>
      )}
      {children && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: "center",
            mt: 1,
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
