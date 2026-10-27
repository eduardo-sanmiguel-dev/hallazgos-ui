import { ReactNode, useId } from "react";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";

interface FormSectionProps {
  title?: string;
  // Texto corto bajo el título (qué se captura en la sección).
  description?: ReactNode;
  // Campos, cada uno envuelto en un <Grid size={...}>.
  children: ReactNode;
}

// Tarjeta que agrupa los campos de un formulario. Con título, la sección
// queda nombrada para lectores de pantalla (formularios largos como CIAEL).
export default function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  const titleId = useId();

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={title ? titleId : undefined}
      sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
    >
      {title && (
        <Typography
          id={titleId}
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 600, color: "text.primary", mb: description ? 0.5 : 2 }}
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
      )}
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}
