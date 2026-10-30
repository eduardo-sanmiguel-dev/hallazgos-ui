import { useMemo, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog } from "@mui/material";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { IconButton } from "@mui/material";
import { Box } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { v4 as uuidv4 } from "uuid";

import { dataURLtoFile, notify } from "@shared/utils";
import { EvidencesService } from "@services";
import ImageORCamera from "@shared/components/ImageORCamera";
import { useUploadProgress } from "@hooks/useUploadProgress";
import { useFormDraft } from "@hooks/useFormDraft";
import DraftNotice from "@shared/components/DraftNotice";

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

interface Props {
  isOpen: boolean;
  handleClose: (refresh?: boolean) => void;
  idRow: number;
}

export default function StartProcessEvidence({
  isOpen,
  handleClose,
  idRow,
}: Props) {
  const [image, setImage] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const upload = useUploadProgress();
  // Borrador local por hallazgo (C3): la foto queda en el dispositivo hasta
  // enviarse; incluye la clave de idempotencia.
  const draft = useFormDraft<Record<string, never>>({
    form: idRow ? `iniciar:${idRow}` : null,
    content: { fields: {}, photo: attachedFile },
    hasContent: ({ photo }) => !!photo,
    onRestore: ({ photo }) => {
      setImage("");
      setAttachedFile(photo);
    },
  });
  const isLocked = !!draft.lock;

  // El estado "enviando" del borrador cuenta como parte del guardado.
  const processMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await draft.markSending();
      return EvidencesService.processStart(idRow, formData, {
        onUploadProgress: upload.onUploadProgress,
        idempotencyKey: draft.key(),
      });
    },
    onSuccess: async ({ replayed }) => {
      await draft.settle();
      notify(
        replayed
          ? `Ya se había guardado (hallazgo #${idRow})`
          : "Estatus actualizado a En progreso",
        true,
      );
      handleClose(true);
    },
    onError: (error) => draft.settle(error),
    onSettled: () => upload.reset(),
  });
  const isLoading = processMutation.isPending;
  // En celular a pantalla completa: con la cámara adentro quedaba apretado.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  // También es "Reintentar envío" de un borrador en solo lectura.
  const saveProcessStart = async () => {
    const formData = new FormData();
    const uuid = uuidv4();

    if (image) {
      formData.append("file", dataURLtoFile(image, `${uuid}-process.png`));
    } else if (attachedFile) {
      const extension = attachedFile.name.split(".").pop();
      const nameWithUuid = `${uuid}-process.${extension}`;
      formData.append("file", attachedFile, nameWithUuid);
    }

    processMutation.mutate(formData);
  };

  // Descartar: si estaba en solo lectura se quita la foto.
  const discardDraft = async () => {
    if (!(await draft.discard())) return;
    setImage("");
    setAttachedFile(null);
  };

  const isDisabled = useMemo(
    () => !(image || attachedFile) || isLoading,
    [image, attachedFile, isLoading],
  );

  return (
    <BootstrapDialog
      // Mientras se guarda no se permite cerrar (backdrop / Escape).
      onClose={() => {
        if (!isLoading) handleClose();
      }}
      aria-labelledby="start-process-dialog-title"
      open={isOpen}
      fullWidth={true}
      maxWidth={false}
      fullScreen={isPhone}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="start-process-dialog-title">
        Iniciar hallazgo #{idRow}
      </DialogTitle>
      <IconButton
        aria-label="Cerrar"
        onClick={() => handleClose()}
        disabled={isLoading}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        {(draft.offer || draft.lock) && (
          <Box sx={{ mb: 2 }}>
            <DraftNotice
              offer={draft.offer}
              lock={draft.lock}
              onRestore={draft.restore}
              onDiscard={discardDraft}
              onRetry={saveProcessStart}
              isSending={isLoading}
            />
          </Box>
        )}
        <ImageORCamera
          setImage={setImage}
          image={image}
          setAttachedFile={setAttachedFile}
          attachedFile={attachedFile}
          uploadProgress={upload.progress}
          readOnly={isLocked}
        />
      </DialogContent>
      {/* Con un envío pendiente, las acciones son las del aviso. */}
      <DialogActions
        sx={{ justifyContent: "center", ...(isLocked && { display: "none" }) }}
      >
        <Button
          onClick={saveProcessStart}
          variant="contained"
          loading={isLoading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          disabled={isDisabled}
        >
          {isLoading ? "Guardando inicio..." : "Guardar imagen"}
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
