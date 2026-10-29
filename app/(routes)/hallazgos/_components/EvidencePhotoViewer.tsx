import { KeyboardEvent, useId } from "react";

import Image from "next/image";

import { Box } from "@mui/material";
import { Dialog } from "@mui/material";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export interface EvidencePhoto {
  src: string;
  title: string;
}

interface Props {
  photos: EvidencePhoto[];
  /** Foto abierta; null cierra el visor. */
  index: number | null;
  onChange: (index: number | null) => void;
}

const overlayButtonSx = {
  position: "absolute",
  zIndex: 2,
  color: "common.white",
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.65)" },
} as const;

// Visor de las fotos del hallazgo a pantalla completa, de borde a borde. Con
// varias fotos se pasa de una a otra con las flechas (botones o teclado).
export default function EvidencePhotoViewer({
  photos,
  index,
  onChange,
}: Props) {
  const titleId = useId();
  const photo = index === null ? null : photos[index];
  const hasMany = photos.length > 1;

  const go = (step: number) => {
    if (index === null) return;
    onChange((index + step + photos.length) % photos.length);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!hasMany) return;
    if (event.key === "ArrowLeft") go(-1);
    if (event.key === "ArrowRight") go(1);
  };

  return (
    <Dialog
      fullScreen
      open={!!photo}
      onClose={() => onChange(null)}
      onKeyDown={onKeyDown}
      aria-labelledby={titleId}
      // Negro también detrás de los botones del sistema (sin la zona segura
      // que agregan los demás diálogos a pantalla completa).
      slotProps={{ paper: { sx: { pb: 0 } } }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100vw",
          height: "100dvh",
          backgroundColor: "black",
        }}
      >
        <IconButton
          onClick={() => onChange(null)}
          sx={{ ...overlayButtonSx, top: 12, right: 12 }}
          aria-label="Cerrar imagen"
        >
          <CloseIcon />
        </IconButton>

        {photo && (
          <Typography
            id={titleId}
            variant="subtitle1"
            sx={{
              position: "absolute",
              top: 18,
              left: 18,
              right: 72,
              zIndex: 2,
              width: "fit-content",
              color: "common.white",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            {photo.title}
            {hasMany && ` · ${(index ?? 0) + 1} de ${photos.length}`}
          </Typography>
        )}

        {hasMany && (
          <>
            <IconButton
              onClick={() => go(-1)}
              sx={{
                ...overlayButtonSx,
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              aria-label="Foto anterior"
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
            <IconButton
              onClick={() => go(1)}
              sx={{
                ...overlayButtonSx,
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
              aria-label="Foto siguiente"
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          </>
        )}

        {photo && (
          <Image
            unoptimized
            src={photo.src}
            alt={photo.title}
            fill
            sizes="100vw"
            style={{ objectFit: "contain" }}
            priority
          />
        )}
      </Box>
    </Dialog>
  );
}
