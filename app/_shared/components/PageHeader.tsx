import { ReactNode } from "react";

import { Box } from "@mui/material";
import { Typography } from "@mui/material";

import { TOUCH_MEDIA } from "../../theme";
import PageBreadcrumbs from "./PageBreadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  // Acciones de la página (Crear, Actualizar, Exportar...), a la derecha.
  children?: ReactNode;
  // Ruta según el menú sobre el título (formularios y detalles, B2). La
  // última miga es el título.
  breadcrumbs?: boolean;
  // Navegación de las migas (p. ej. confirmar antes de salir).
  onNavigate?: (href: string) => void;
}

// Encabezado de página: título principal (h1) y acciones.
export default function PageHeader({
  title,
  description,
  children,
  breadcrumbs = false,
  onNavigate,
}: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        columnGap: 2,
        rowGap: 1.5,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {breadcrumbs && (
          <PageBreadcrumbs current={title} onNavigate={onNavigate} />
        )}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            color: "text.primary",
            fontSize: { xs: "1.625rem", sm: "2.125rem" },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {children && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            // En celular, fila propia bajo el título (sin importar su largo)
            // y la acción principal (botón contained) ocupa el espacio libre.
            width: { xs: "100%", sm: "auto" },
            "& > .MuiButton-contained": {
              flex: { xs: "1 1 auto", sm: "0 0 auto" },
            },
            // Botones de al menos 40 px de alto (48 px en pantallas táctiles).
            "& > .MuiButton-root": {
              minHeight: 40,
              [TOUCH_MEDIA]: { minHeight: 48 },
            },
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
