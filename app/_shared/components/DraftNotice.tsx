import PoliteAlert from "@shared/components/PoliteAlert";
import { AlertTitle, Button, Stack } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import SendIcon from "@mui/icons-material/Send";

import type { DraftLock, DraftOffer } from "@hooks/useFormDraft";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

interface Props {
  offer: DraftOffer | null;
  lock: DraftLock | null;
  onRestore: () => void;
  onDiscard: () => void;
  onRetry: () => void;
  isSending?: boolean;
}

// Aviso del borrador local (useFormDraft), arriba del formulario:
// - Al abrir, si hay un borrador: "Recuperar" o "Descartar".
// - Con un envío sin respuesta: lo capturado queda en solo lectura y las
//   únicas acciones son "Reintentar envío" (misma clave, no duplica) o
//   "Descartar".
export default function DraftNotice({
  offer,
  lock,
  onRestore,
  onDiscard,
  onRetry,
  isSending = false,
}: Props) {
  if (lock) {
    return (
      <PoliteAlert severity="warning">
        <AlertTitle>Envío sin confirmar</AlertTitle>
        Se intentó enviar el {formatWhen(lock.lastSendAt)} y no sabemos si llegó
        {lock.sendState === "unconfirmed" ? " (el servidor falló)" : ""}. Para no duplicarlo ni
        perder cambios, no se puede editar: reintenta el envío o descártalo.
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={onRetry}
            data-dd-action-name="Reintentar envío sin confirmar"
            loading={isSending}
            loadingPosition="start"
          >
            Reintentar envío
          </Button>
          <Button
            color="error"
            startIcon={<DeleteOutlineIcon />}
            onClick={onDiscard}
            disabled={isSending}
          >
            Descartar envío pendiente
          </Button>
        </Stack>
      </PoliteAlert>
    );
  }

  if (!offer) return null;

  const isPending = offer.sendState !== "none";

  return (
    <PoliteAlert severity={isPending ? "warning" : "info"}>
      <AlertTitle>{isPending ? "Tienes un envío sin confirmar" : "Tienes un borrador"}</AlertTitle>
      {isPending
        ? `Se intentó enviar el ${formatWhen(offer.lastSendAt ?? offer.savedAt)}${offer.hasPhoto ? ", con foto" : ""}. Recupéralo para reintentar el envío.`
        : `Guardado el ${formatWhen(offer.savedAt)}${offer.hasPhoto ? ", con foto" : ""}.`}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
        <Button variant="contained" startIcon={<RestoreIcon />} onClick={onRestore}>
          Recuperar borrador
        </Button>
        <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={onDiscard}>
          Descartar borrador
        </Button>
      </Stack>
    </PoliteAlert>
  );
}
