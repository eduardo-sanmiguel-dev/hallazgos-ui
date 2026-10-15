import { useMemo, useState } from "react";

import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog } from "@mui/material";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { v4 as uuidv4 } from "uuid";

import { dataURLtoFile, notify } from "@shared/utils";
import { EvidencesService, handleErrorResponse } from "@services";
import ImageORCamera from "@shared/components/ImageORCamera";

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
    EvidencesService.processStart(idRow, formData)
      .then(() => {
        notify("Estatus actualizado a En progreso", true);
        handleClose(true);
      })
      .catch(handleErrorResponse)
      .finally(() => setIsLoading(false));
  };

  const isDisabled = useMemo(
    () => !(image || attachedFile) || isLoading,
    [image, attachedFile, isLoading],
  );

  return (
    <BootstrapDialog
      onClose={() => handleClose()}
      aria-labelledby="start-process-dialog-title"
      open={isOpen}
      fullWidth={true}
      maxWidth={false}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="start-process-dialog-title">
        Evidencia de inicio de proceso
      </DialogTitle>
      <IconButton
        aria-label="Cerrar"
        onClick={() => handleClose()}
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
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={saveProcessStart}
          variant="contained"
          disabled={isDisabled}
        >
          Guardar imagen
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}
