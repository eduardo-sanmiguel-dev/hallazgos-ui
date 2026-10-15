import { useRef } from "react";

import { Button } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SignatureCanvas from "react-signature-canvas";

import { Transition } from "@routes/hallazgos/_components/EvidencePreview";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  setSignature: (signature: string) => void;
}

export default function DialogSignatureEpp({
  open,
  setOpen,
  setSignature,
}: Props) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const canvasWidth = isMobile ? 300 : 500;
  const canvasHeight = 200;

  const handleClose = () => {
    setOpen(false);
  };

  const clearSignature = () => {
    if (!sigCanvas.current) return;
    sigCanvas.current.clear();
  };

  const saveSignature = () => {
    if (!sigCanvas.current) return;
    const dataURL = sigCanvas.current.toDataURL();
    setSignature(dataURL);
    handleClose();
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleClose}
      slots={{ transition: Transition }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="Cerrar sin firmar"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="h2">
            Firma del colaborador
          </Typography>
        </Toolbar>
      </AppBar>
      {/* El canvas se muestra exactamente al tamaño en que dibuja: si se
          estira, el trazo queda desplazado respecto al puntero o al dedo. */}
      <Paper
        elevation={3}
        sx={{ p: 2, width: "fit-content", maxWidth: "100%", mx: "auto", mt: 10 }}
      >
        <Typography variant="h6" gutterBottom>
          Firma electrónica
        </Typography>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            width: canvasWidth + 2,
            height: canvasHeight + 2,
          }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: canvasWidth,
              height: canvasHeight,
              style: {
                display: "block",
                width: canvasWidth,
                height: canvasHeight,
              },
            }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button variant="outlined" onClick={clearSignature}>
            Limpiar
          </Button>
          <Button variant="contained" onClick={saveSignature}>
            Guardar
          </Button>
        </Box>
      </Paper>
    </Dialog>
  );
}
