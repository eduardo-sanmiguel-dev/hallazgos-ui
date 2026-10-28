import { Box } from "@mui/material";
import { Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { TOUCH_MEDIA } from "../../theme";

interface FormActionsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving?: boolean;
  // Guardar deshabilitado (por ejemplo, mientras faltan campos obligatorios).
  isSaveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  // Lado a lado también en celular (barras fijas al pie, donde apilados
  // ocupan demasiado alto). Cancelar a su medida, sin ícono en celular;
  // Guardar con el resto del ancho.
  inline?: boolean;
}

// Botones Cancelar y Guardar al pie de un formulario. En móvil ocupan todo
// el ancho y Guardar queda arriba (salvo con `inline`).
export default function FormActions({
  onCancel,
  onSave,
  isSaving = false,
  isSaveDisabled = false,
  saveLabel = "Guardar",
  cancelLabel = "Cancelar",
  inline = false,
}: FormActionsProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: inline ? "row" : { xs: "column-reverse", sm: "row" },
        justifyContent: "flex-end",
        gap: 1.5,
        // 44 px con mouse; en pantalla táctil, los 48 px del tema (A2). Antes
        // este 44 le ganaba al tema también en táctil.
        "& .MuiButton-root": {
          minWidth: inline ? { xs: 0, sm: 160 } : { sm: 160 },
          minHeight: 44,
          [TOUCH_MEDIA]: { minHeight: 48 },
          ...(inline && { whiteSpace: "nowrap" }),
        },
        ...(inline && {
          "& .form-actions-save": { flex: { xs: 1, sm: "none" } },
          "& .form-actions-cancel": {
            flex: "none",
            px: { xs: 2, sm: undefined },
            "& .MuiButton-startIcon": {
              display: { xs: "none", sm: "inherit" },
            },
          },
        }),
      }}
    >
      <Button
        className="form-actions-cancel"
        variant="outlined"
        startIcon={<CloseIcon />}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        className="form-actions-save"
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
