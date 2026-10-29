"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";

import dynamic from "next/dynamic";
import Image from "next/image";

import { Alert } from "@mui/material";
import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { Paper } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";

import {
  compressEvidenceImage,
  EvidenceImageError,
  formatFileSize,
} from "@shared/utils/evidenceImage";
import LoadingLinear from "./LoadingLinear";
import { TOUCH_MEDIA } from "../../theme";

const BrowserCamera = dynamic(() => import("./PhotoCaptureBrowserCamera"), {
  ssr: false,
  loading: () => <LoadingLinear label="Abriendo cámara…" />,
});

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export interface PhotoCaptureProps {
  file: File | null;
  onChange: (file: File | null) => void;
  // 0-100 mientras se sube; null o undefined si no se está subiendo.
  uploadProgress?: number | null;
  disabled?: boolean;
  // Solo se ve la foto, sin cambiarla ni quitarla (borrador con un envío
  // pendiente: ver useFormDraft).
  readOnly?: boolean;
}

// Foto de evidencia, en un área con borde punteado. Siempre entrega una
// imagen comprimida (máx. 1920 px y ~1 MB) lista para subir.
// - Pantalla táctil (celular, tablet): "Tomar foto" abre la cámara del
//   teléfono (principal) y "Elegir de galería", las fotos guardadas. Sin la
//   cámara del navegador: la del teléfono hace lo mismo y mejor.
// - Con mouse (escritorio): el navegador no abre la cámara con `capture` y los
//   dos botones abrían el mismo selector de archivos; ahí hay un solo "Subir
//   foto", la cámara web ("Usar cámara del navegador") y arrastrar la foto.
export default function PhotoCapture({
  file,
  onChange,
  uploadProgress,
  disabled = false,
  readOnly = false,
}: PhotoCaptureProps) {
  const [mode, setMode] = useState<"pick" | "browserCamera">("pick");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const isTouch = useMediaQuery(TOUCH_MEDIA, { noSsr: true });

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const process = async (source: Blob) => {
    setError("");
    setIsProcessing(true);
    try {
      onChange(await compressEvidenceImage(source));
      setMode("pick");
    } catch (cause) {
      setError(
        cause instanceof EvidenceImageError
          ? cause.message
          : "No se pudo procesar la imagen. Intenta con otra foto.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    // Permite volver a elegir la misma foto después de quitarla.
    event.target.value = "";
    if (selected) process(selected);
  };

  const handleBrowserPhoto = async (dataUri: string) => {
    const blob = await (await fetch(dataUri)).blob();
    process(blob);
  };

  const isUploading = uploadProgress !== null && uploadProgress !== undefined;
  const isBusy = disabled || isProcessing || isUploading;

  // Escritorio: soltar una foto en el área equivale a "Subir foto".
  const dropProps = isTouch
    ? {}
    : {
        onDragOver: (event: DragEvent) => {
          event.preventDefault();
          if (!isBusy) setIsDragging(true);
        },
        onDragLeave: () => setIsDragging(false),
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          setIsDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped && !isBusy) process(dropped);
        },
      };

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {mode === "browserCamera" ? (
        <Box>
          <BrowserCamera
            onTakePhoto={handleBrowserPhoto}
            onError={() => {
              setMode("pick");
              setError(
                "No se pudo abrir la cámara del navegador. Usa «Subir foto».",
              );
            }}
          />
          <Button
            startIcon={<CloseIcon />}
            onClick={() => setMode("pick")}
            sx={{ mt: 1 }}
          >
            Cancelar cámara
          </Button>
        </Box>
      ) : (
        !file &&
        !readOnly && (
          <Stack
            spacing={1.5}
            {...dropProps}
            sx={{
              alignItems: "center",
              textAlign: "center",
              p: { xs: 2, sm: 3 },
              borderRadius: 2,
              border: "2px dashed",
              borderColor: isDragging ? "primary.main" : "divider",
              backgroundColor: isDragging ? "action.selected" : "action.hover",
              transition: "border-color 150ms, background-color 150ms",
            }}
          >
            <AddAPhotoOutlinedIcon
              aria-hidden
              sx={{ fontSize: 36, color: "text.secondary" }}
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {isTouch
                ? "Toma una foto de lo que observaste."
                : "Sube una foto de lo que observaste o arrástrala aquí."}
            </Typography>
            {isTouch ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ width: "100%" }}
              >
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<PhotoCameraIcon />}
                  disabled={isBusy}
                  sx={{ flex: 1 }}
                >
                  Tomar foto
                  {/* Abre la cámara trasera del teléfono (mejor enfoque,
                      flash y resolución). */}
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleInput}
                    disabled={isBusy}
                  />
                </Button>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoLibraryIcon />}
                  disabled={isBusy}
                  sx={{ flex: 1, backgroundColor: "background.paper" }}
                >
                  Elegir de galería
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleInput}
                    disabled={isBusy}
                  />
                </Button>
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                sx={{ flexWrap: "wrap", justifyContent: "center" }}
              >
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<FileUploadOutlinedIcon />}
                  disabled={isBusy}
                >
                  Subir foto
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleInput}
                    disabled={isBusy}
                  />
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VideocamOutlinedIcon />}
                  onClick={() => {
                    setError("");
                    setMode("browserCamera");
                  }}
                  disabled={isBusy}
                  // Fondo del papel: sobre el área gris se distingue.
                  sx={{ backgroundColor: "background.paper" }}
                >
                  Usar cámara del navegador
                </Button>
              </Stack>
            )}
          </Stack>
        )
      )}

      {isProcessing && (
        <Stack
          direction="row"
          spacing={1.5}
          role="status"
          sx={{ alignItems: "center" }}
        >
          <CircularProgress size={20} aria-hidden />
          <Typography variant="body2">Procesando imagen…</Typography>
        </Stack>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {readOnly && !file && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Sin foto.
        </Typography>
      )}

      {file && previewUrl && (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: { xs: 260, sm: 360 },
              bgcolor: "action.hover",
            }}
          >
            <Image
              src={previewUrl}
              alt="Vista previa de la evidencia"
              fill
              unoptimized
              sizes="100vw"
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              px: 2,
              py: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Foto lista · {formatFileSize(file.size)}
            </Typography>
            {!readOnly && (
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => onChange(null)}
                disabled={isBusy}
              >
                Quitar foto
              </Button>
            )}
          </Stack>
          {isUploading && (
            <Box sx={{ px: 2, pb: 2 }} role="status">
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Subiendo foto… {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                aria-label="Progreso de subida"
              />
            </Box>
          )}
        </Paper>
      )}
    </Stack>
  );
}
