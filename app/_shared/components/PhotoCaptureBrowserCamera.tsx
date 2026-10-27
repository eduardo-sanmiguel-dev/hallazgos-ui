"use client";

import Camera, { FACING_MODES, IMAGE_TYPES } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";

interface Props {
  onTakePhoto: (dataUri: string) => void;
  onError?: () => void;
}

// Cámara dentro del navegador (alternativa a la del teléfono). Se carga solo
// al pedirla. Antes guardaba la foto al tamaño del visor (p. ej. 385 × 540).
export default function PhotoCaptureBrowserCamera({
  onTakePhoto,
  onError,
}: Props) {
  return (
    <Camera
      onTakePhoto={onTakePhoto}
      onCameraError={onError}
      idealFacingMode={FACING_MODES.ENVIRONMENT}
      // Resolución máxima de la cámara; luego se reduce a 1920 px al
      // comprimir (compressEvidenceImage).
      isMaxResolution
      imageType={IMAGE_TYPES.JPG}
      // Es evidencia: la foto no va en espejo.
      isImageMirror={false}
    />
  );
}
