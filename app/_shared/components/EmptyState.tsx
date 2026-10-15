import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Typography } from "@mui/material";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

interface EmptyStateProps {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  // Acciones opcionales (por ejemplo, un botón "Crear").
  children?: ReactNode;
  size?: "small" | "medium";
}

// Mensaje para listas o tablas sin registros.
export default function EmptyState({
  title = "Sin registros",
  description,
  icon = <InboxOutlinedIcon />,
  children,
  size = "medium",
}: EmptyStateProps) {
  const isSmall = size === "small";

  return (
    <Box
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
          color: "text.secondary",
          backgroundColor: theme.palette.action.hover,
          "& .MuiSvgIcon-root": { fontSize: isSmall ? 22 : 30 },
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
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
      )}
      {children && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}
