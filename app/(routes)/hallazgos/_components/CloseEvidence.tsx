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
import confetti from "canvas-confetti";

import { dataURLtoFile, notify } from "@shared/utils";
import { EvidencesService } from "@services";

import "react-html5-camera-photo/build/css/index.css";
import ImageORCamera from "@shared/components/ImageORCamera";
import { EvidenceGraphql, useIdempotencyKey, useUploadProgress } from "@hooks";
import { Grid, Paper, TextField } from "@mui/material";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { requiresPhotoEvidence } from "@routes/hallazgos/_constants/mainTypes";

export const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

// Celebración sutil al cerrar: una sola ráfaga corta desde abajo al centro.
// zIndex por encima de los diálogos de MUI (1300).
const celebrateClose = () => {
  confetti({
    particleCount: 60,
    spread: 60,
    startVelocity: 30,
    gravity: 1.2,
    ticks: 150,
    scalar: 0.8,
    origin: { y: 0.75 },
    zIndex: 2000,
    disableForReducedMotion: true,
    colors: ["#1976d2", "#2e7d32", "#ffb300", "#e91e63", "#9c27b0"],
  });
};

interface Props {
  isOpen: boolean;
  handleClose: (refresh?: boolean) => void;
  idRow: number;
  evidenceCurrent: EvidenceGraphql | null;
}

export default function CloseEvidence({
  isOpen,
  handleClose,
  idRow,
  evidenceCurrent,
}: Props) {
  const [image, setImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [descriptionSolution, setDescriptionSolution] = useState<string>("");
  // La clasificación del hallazgo decide si la foto es obligatoria.
  const isUnsafeBehavior = !requiresPhotoEvidence(evidenceCurrent?.mainType);
  const { confirm, confirmDialog } = useConfirmDialog();
  // Por hallazgo: el diálogo se reutiliza entre filas.
  const submission = useIdempotencyKey(idRow);
  const upload = useUploadProgress();
  // En celular a pantalla completa: con la cámara adentro quedaba apretado.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const currentDescriptionSolution = useMemo(
    () => descriptionSolution.trim(),
    [descriptionSolution],
  );

  const saveSolution = () => {
    const formData = new FormData();

    const uuid = uuidv4();

    if (image) {
      formData.append("file", dataURLtoFile(image, `${uuid}-solution.png`));
    } else if (attachedFile) {
      const extension = attachedFile.name.split(".").pop();

      const nameWithUuid = `${uuid}-solution.${extension}`;

      formData.append("file", attachedFile, nameWithUuid);
    }

    formData.append("descriptionSolution", descriptionSolution);

    setIsLoading(true);
    return EvidencesService.solution(idRow, formData, {
      onUploadProgress: upload.onUploadProgress,
      idempotencyKey: submission.key(),
    })
      .then(() => {
        submission.settle();
        notify("Hallazgo cerrado correctamente", true);
        celebrateClose();
        handleClose(true);
      })
      .catch(submission.settle)
      .finally(() => {
        setIsLoading(false);
        upload.reset();
      });
  };

  const isDisabled = useMemo(() => {
    //return !(image || attachedFile) || isLoading;
    return isUnsafeBehavior
      ? !currentDescriptionSolution || isLoading
      : !(image || attachedFile) || isLoading;
  }, [
    image,
    attachedFile,
    isLoading,
    currentDescriptionSolution,
    isUnsafeBehavior,
  ]);

  return (
    <BootstrapDialog
      // Mientras se guarda no se permite cerrar (backdrop / Escape) para no
      // perder la respuesta del API ni dejar al usuario sin saber el resultado.
      onClose={() => {
        if (!isLoading) handleClose();
      }}
      aria-labelledby="customized-dialog-title"
      open={isOpen}
      fullWidth={true}
      maxWidth={false}
      fullScreen={isPhone}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        Cerrar hallazgo #{idRow}
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
        <Grid container spacing={2}>
          {isUnsafeBehavior && (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
            >
              <b>{evidenceCurrent?.description ? "Lo que se observó: " : ""}</b>
              {evidenceCurrent?.description ? evidenceCurrent.description : ""}
            </Grid>
          )}

          {isUnsafeBehavior && (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 6,
              }}
            >
              <Paper sx={{ p: 2 }}>
                <TextField
                  id="description-multiline-solution"
                  multiline
                  rows={2}
                  variant="standard"
                  fullWidth
                  value={descriptionSolution}
                  onChange={(e) => setDescriptionSolution(e.target.value)}
                  label="Describe cómo se resolvió"
                  // Sin rojo de entrada: "Guardar" se habilita al escribirla.
                  helperText="Obligatoria para cerrar este hallazgo."
                />
              </Paper>
            </Grid>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <ImageORCamera
            setImage={setImage}
            image={image}
            setAttachedFile={setAttachedFile}
            attachedFile={attachedFile}
            uploadProgress={upload.progress}
          />
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          // Cerrar es irreversible: se confirma antes de enviar. La
          // confirmación se cierra al aceptar para que se vea el progreso de
          // subida aquí (antes su spinner lo tapaba).
          onClick={async () => {
            const confirmed = await confirm({
              title: `¿Cerrar el hallazgo #${idRow}?`,
              description:
                "Ya no se podrá modificar y se enviará un aviso por correo.",
              confirmLabel: "Cerrar hallazgo",
              cancelLabel: "Revisar",
            });
            if (confirmed) saveSolution();
          }}
          variant="contained"
          loading={isLoading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          disabled={isDisabled}
        >
          {isLoading ? "Guardando cierre..." : "Guardar imagen"}
        </Button>
      </DialogActions>
      {confirmDialog}
    </BootstrapDialog>
  );
}
