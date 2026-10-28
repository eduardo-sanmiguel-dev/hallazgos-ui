import { useMemo, useState } from "react";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog } from "@mui/material";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { IconButton } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { v4 as uuidv4 } from "uuid";

import { dataURLtoFile, notify } from "@shared/utils";
import { EvidencesService } from "@services";
import ImageORCamera from "@shared/components/ImageORCamera";
import { useUploadProgress } from "@hooks/useUploadProgress";
import { useIdempotencyKey } from "@hooks/useIdempotencyKey";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const upload = useUploadProgress();
  // Por hallazgo: el diálogo se reutiliza entre filas.
  const submission = useIdempotencyKey(idRow);
  // En celular a pantalla completa: con la cámara adentro quedaba apretado.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const saveProcessStart = () => {
    const formData = new FormData();
    const uuid = uuidv4();

    if (image) {
      formData.append("file", dataURLtoFile(image, `${uuid}-process.png`));
    } else if (attachedFile) {
      const extension = attachedFile.name.split(".").pop();
      const nameWithUuid = `${uuid}-process.${extension}`;
      formData.append("file", attachedFile, nameWithUuid);
    }

    setIsLoading(true);
    EvidencesService.processStart(idRow, formData, {
      onUploadProgress: upload.onUploadProgress,
      idempotencyKey: submission.key(),
    })
      .then(() => {
        submission.settle();
        notify("Estatus actualizado a En progreso", true);
        handleClose(true);
      })
      .catch(submission.settle)
      .finally(() => {
        setIsLoading(false);
        upload.reset();
      });
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
        <ImageORCamera
          setImage={setImage}
          image={image}
          setAttachedFile={setAttachedFile}
          attachedFile={attachedFile}
          uploadProgress={upload.progress}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
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
