import { ReactNode, useId } from "react";

import { Box } from "@mui/material";
import { Chip } from "@mui/material";
import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

interface FilterBarProps {
  // Número de registros que cumplen los filtros.
  count?: number;
  // Campos de filtro, cada uno envuelto en un <Grid size={...}>.
  children: ReactNode;
}

const countLabel = (count: number) =>
  `${count} ${count === 1 ? "registro" : "registros"}`;

// Contenedor de filtros de un listado.
export default function FilterBar({ count, children }: FilterBarProps) {
  const titleId = useId();

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <FilterListIcon
          fontSize="small"
          aria-hidden
          sx={{ color: "text.secondary" }}
        />
        <Typography
          id={titleId}
          variant="subtitle2"
          component="h2"
          sx={{ color: "text.primary" }}
        >
          Filtros
        </Typography>
        {count !== undefined && (
          <Chip size="small" label={countLabel(count)} sx={{ ml: "auto" }} />
        )}
      </Box>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}
