import { Box } from "@mui/material";
import { Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  // Guardar deshabilitado (por ejemplo, mientras faltan campos obligatorios).
  isSaveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

// Botones Cancelar y Guardar al pie de un formulario. En móvil ocupan todo
// el ancho y Guardar queda arriba.
export default function FormActions({
  onCancel,
  onSave,
  isSaving = false,
  isSaveDisabled = false,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
}: FormActionsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column-reverse", sm: "row" },
        justifyContent: "flex-end",
        gap: 1.5,
        "& .MuiButton-root": { minWidth: { sm: 160 }, minHeight: 44 },
      }}
    >
      <Button variant="outlined" startIcon={<CloseIcon />} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        loading={isSaving}
        loadingPosition="start"
        startIcon={<SaveIcon />}
        variant="contained"
        color="primary"
        onClick={onSave}
        disabled={isSaveDisabled || isSaving}
      >
        {saveLabel}
      </Button>
    </Box>
  );
}
