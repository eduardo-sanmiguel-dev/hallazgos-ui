import { ReactNode, useCallback, useId, useRef, useState } from "react";

import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { DialogActions } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogContentText } from "@mui/material";
import { DialogTitle } from "@mui/material";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" pinta el botón de confirmar en rojo (eliminar, desactivar...).
  tone?: "danger" | "default";
  // Si se pasa, el diálogo sigue abierto con spinner en el botón de confirmar
  // hasta que la promesa termine (p. ej. la llamada al API de eliminar).
  action?: () => Promise<unknown> | void;
}

interface ConfirmDialogProps extends Omit<ConfirmOptions, "action"> {
  open: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Diálogo de confirmación. El foco inicia en "Cancelar" para que Enter no
// confirme una acción destructiva por accidente.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  isBusy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isBusy) onClose();
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      {description && (
        <DialogContent>
          <DialogContentText id={descriptionId}>
            {description}
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} autoFocus disabled={isBusy}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={tone === "danger" ? "error" : "primary"}
          onClick={onConfirm}
          loading={isBusy}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Uso:
//   const { confirm, confirmDialog } = useConfirmDialog();
//   if (await confirm({ title: "¿Eliminar?", tone: "danger" })) { ... }
//   // o, para mostrar el spinner mientras responde el API:
//   await confirm({ title: "¿Eliminar?", action: () => remove(id) });
//   return <>{...}{confirmDialog}</>;
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => {
    setOptions(nextOptions);
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (confirmed: boolean) => {
    setOpen(false);
    resolver.current?.(confirmed);
    resolver.current = null;
  };

  const handleConfirm = async () => {
    if (!options.action) {
      settle(true);
      return;
    }

    setIsBusy(true);
    try {
      await options.action();
    } catch {
      // El error ya lo notifica el servicio; solo se cierra el diálogo.
    } finally {
      setIsBusy(false);
      settle(true);
    }
  };

  const { action: _action, ...dialogOptions } = options;

  const confirmDialog = (
    <ConfirmDialog
      {...dialogOptions}
      open={open}
      isBusy={isBusy}
      onConfirm={handleConfirm}
      onClose={() => settle(false)}
    />
  );

  return { confirm, confirmDialog };
}
