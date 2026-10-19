import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";

interface Props {
  // Solo se muestra cuando hay algún filtro distinto al valor por defecto.
  visible: boolean;
  onClick: () => void;
}

// Botón "Limpiar filtros" para usar dentro de <FilterBar>.
export default function ClearFiltersButton({ visible, onClick }: Props) {
  if (!visible) return null;

  return (
    <Grid size={{ xs: 12 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<ClearAllIcon />}
          onClick={onClick}
          color="secondary"
        >
          Limpiar filtros
        </Button>
      </Box>
    </Grid>
  );
}
