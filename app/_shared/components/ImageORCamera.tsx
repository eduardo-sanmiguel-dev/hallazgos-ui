"use client";

import PhotoCapture from "./PhotoCapture";

interface Props {
  // Compatibilidad: antes la cámara del navegador entregaba un data URI en
  // `image`. Ahora toda foto llega como archivo comprimido en `attachedFile`,
  // así que `image` siempre se limpia.
  setImage: (image: string) => void;
  image?: string;
  setAttachedFile: (file: File | null) => void;
  attachedFile: File | null;
  uploadProgress?: number | null;
}

// Envoltorio de PhotoCapture con la interfaz que ya usan los formularios de
// hallazgos e ICS. Para código nuevo, usar PhotoCapture directamente.
const ImageORCamera = ({
  setImage,
  setAttachedFile,
  attachedFile,
  uploadProgress,
}: Props) => (
  <PhotoCapture
    file={attachedFile}
    uploadProgress={uploadProgress}
    onChange={(file) => {
      setImage("");
      setAttachedFile(file);
    }}
  />
);

export default ImageORCamera;
