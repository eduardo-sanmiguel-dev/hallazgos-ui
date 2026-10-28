"use client";

import { ChangeEvent, useEffect, useState } from "react";

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
import { styled } from "@mui/material/styles";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";

import {
  compressEvidenceImage,
  EvidenceImageError,
  formatFileSize,
} from "@shared/utils/evidenceImage";
import LoadingLinear from "./LoadingLinear";

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

// Foto de evidencia: cámara del teléfono (principal), galería o, como
// alternativa, cámara del navegador. Siempre entrega una imagen comprimida
// (máx. 1920 px y ~1 MB) lista para subir.
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

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {mode === "browserCamera" ? (
        <Box>
          <BrowserCamera
            onTakePhoto={handleBrowserPhoto}
            onError={() => {
              setMode("pick");
              setError(
                "No se pudo abrir la cámara del navegador. Usa «Tomar foto» o «Elegir de galería».",
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
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCameraIcon />}
                disabled={isBusy}
                sx={{ flex: 1 }}
              >
                Tomar foto
                {/* En celular abre la cámara del teléfono (mejor enfoque,
                    flash y resolución); en escritorio, el selector. */}
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
                sx={{ flex: 1 }}
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
            <Button
              startIcon={<VideocamOutlinedIcon />}
              onClick={() => {
                setError("");
                setMode("browserCamera");
              }}
              disabled={isBusy}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Usar cámara del navegador
            </Button>
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
