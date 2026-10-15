import { ReactNode } from "react";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";

interface FormSectionProps {
  title?: string;
  // Campos, cada uno envuelto en un <Grid size={...}>.
  children: ReactNode;
}

// Tarjeta que agrupa los campos de un formulario.
export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
    >
      {title && (
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}
        >
          {title}
        </Typography>
      )}
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}
