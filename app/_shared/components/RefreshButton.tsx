import { Button } from "@mui/material";
import { Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

interface RefreshButtonProps {
  onClick: () => void;
  label?: string;
}

// Botón de solo ícono para volver a consultar los datos de la página.
export default function RefreshButton({
  onClick,
  label = "Actualizar",
}: RefreshButtonProps) {
  return (
    <Tooltip title={label}>
      <Button
        variant="outlined"
        onClick={onClick}
        aria-label={label}
        sx={{ minWidth: 44, px: 1.25 }}
      >
        <RefreshIcon />
      </Button>
    </Tooltip>
  );
}
