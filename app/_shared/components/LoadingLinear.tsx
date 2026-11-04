import { Box } from "@mui/material";
import { LinearProgress } from "@mui/material";

interface LoadingLinearProps {
  // Texto para lectores de pantalla.
  label?: string;
}

export default function LoadingLinear({ label = "Cargando…" }: LoadingLinearProps) {
  return (
    <Box component="output" sx={{ width: "100%" }} aria-live="polite">
      <LinearProgress aria-label={label} />
    </Box>
  );
}
