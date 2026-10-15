import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";

interface LoadingLinearProps {
  // Texto para lectores de pantalla.
  label?: string;
}

export default function LoadingLinear({
  label = "Cargando…",
}: LoadingLinearProps) {
  return (
    <Box sx={{ width: "100%" }} role="status" aria-live="polite">
      <LinearProgress aria-label={label} />
    </Box>
  );
}
