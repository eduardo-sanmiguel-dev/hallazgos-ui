import { useEffect, useRef, useState } from "react";

import { Button } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ScreenRotationIcon from "@mui/icons-material/ScreenRotation";
import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import SignatureCanvas from "react-signature-canvas";

import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { constants } from "@constants";
import { exportSignature } from "../_lib/signatureImage";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  setSignature: (signature: string) => void;
}

// Celular en horizontal: poca altura, el lienzo usa casi toda la pantalla.
const LANDSCAPE_PHONE =
  "@media (orientation: landscape) and (max-height: 500px)";

// Firma del colaborador (A4). El lienzo ocupa el ancho disponible (antes 300 ×
// 200 px en celular) y, con el teléfono en horizontal, casi todo el alto.
// Sin width/height en canvasProps, react-signature-canvas ajusta el lienzo a
// su tamaño en pantalla (con la densidad de píxeles del equipo), así que el
// trazo queda exactamente bajo el dedo. Al cambiar de tamaño (girar el
// teléfono) el lienzo se limpia: se avisa para volver a firmar.
export default function DialogSignatureEpp({
  open,
  setOpen,
  setSignature,
}: Props) {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const isPortraitPhone = useMediaQuery(
    "(orientation: portrait) and (max-width: 599.95px)",
  );
  // Sin trazo no se puede guardar: antes se aceptaba una firma vacía.
  const [hasStroke, setHasStroke] = useState(false);

  // Cada vez que se abre, el lienzo empieza vacío.
  useEffect(() => {
    if (open) setHasStroke(false);
  }, [open]);

  // Al girar o cambiar el tamaño, la librería limpia el lienzo.
  useEffect(() => {
    if (!open) return;
    const sync = () =>
      requestAnimationFrame(() =>
        setHasStroke(!!sigCanvas.current && !sigCanvas.current.isEmpty()),
      );
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  const clearSignature = () => {
    if (!sigCanvas.current) return;
    sigCanvas.current.clear();
    setHasStroke(false);
  };

  const saveSignature = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) return;
    // Recortada al trazo, transparente y reducida (ver signatureImage).
    const dataURL = exportSignature(sigCanvas.current.getTrimmedCanvas());
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
        <Toolbar variant="dense">
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
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 900,
          mx: "auto",
          p: { xs: 1.5, sm: 3 },
          gap: 1.5,
          [LANDSCAPE_PHONE]: { p: 1, gap: 1 },
        }}
      >
        {isPortraitPhone && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", color: "text.secondary" }}
          >
            <ScreenRotationIcon fontSize="small" aria-hidden />
            <Typography variant="body2">
              Gira el teléfono para firmar con más espacio.
            </Typography>
          </Stack>
        )}
        <Box
          data-dd-action-name={constants.rum.ignoredClickName}
          sx={{
            border: 2,
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            // Fondo blanco solo en pantalla: la firma se guarda transparente
            // (en el Excel no tapa los bordes de la celda) y se muestra sobre
            // blanco también en el tema oscuro.
            bgcolor: "#fff",
            // Celular vertical: alargado (2.5:1), como una línea de firma; un
            // recuadro casi cuadrado daba firmas que en el Excel se veían
            // muy chicas. Escritorio y tablet: 320 px de alto.
            aspectRatio: { xs: "5 / 2", sm: "auto" },
            height: { xs: "auto", sm: 320 },
            [LANDSCAPE_PHONE]: { height: "calc(100dvh - 130px)" },
            // Sin desplazamiento ni zoom mientras se firma.
            touchAction: "none",
          }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            // Trazo más grueso que el de omisión (0.5–2.5 px): legible al
            // reducirse en la tabla y en el formato.
            minWidth={1.5}
            maxWidth={3.5}
            onEnd={() => setHasStroke(!sigCanvas.current?.isEmpty())}
            canvasProps={{
              "aria-label": "Recuadro para firmar",
              style: { display: "block", width: "100%", height: "100%" },
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {hasStroke
            ? "Revisa que la firma se lea bien antes de guardar."
            : "Firma dentro del recuadro para poder guardar."}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={clearSignature}
            disabled={!hasStroke}
          >
            Limpiar
          </Button>
          <Button
            variant="contained"
            onClick={saveSignature}
            disabled={!hasStroke}
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
