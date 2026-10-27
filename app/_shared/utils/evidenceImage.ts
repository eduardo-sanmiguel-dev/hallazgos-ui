// Preparación de fotos de evidencia antes de subirlas.
//
// El API acepta JPG, PNG o WEBP de hasta 2 MB y revisa la firma binaria
// (hallazgos-api/src/shared/utils/image-upload.ts). Se comprime a 1920 px en
// el lado mayor y ~1 MB: suficiente para auditoría y rápido con mala señal.

export const EVIDENCE_MAX_SIDE_PX = 1920;
export const EVIDENCE_TARGET_MB = 1;
export const EVIDENCE_API_LIMIT_BYTES = 2 * 1024 * 1024;

const KEEP_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
};

// PNG y WEBP se conservan (capturas de pantalla, diagramas); todo lo demás
// (JPG, HEIC de iPhone, tipos raros) sale como JPG.
export const evidenceOutputType = (inputType: string) =>
  inputType in KEEP_TYPES ? inputType : "image/jpeg";

// La extensión coincide con el contenido: el API valida ambas cosas.
export const evidenceFileName = (outputType: string, now = new Date()) =>
  `evidencia-${now.getTime()}.${KEEP_TYPES[outputType] ?? "jpg"}`;

export class EvidenceImageError extends Error {}

export const compressEvidenceImage = async (file: Blob): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    throw new EvidenceImageError("El archivo no es una imagen.");
  }

  const outputType = evidenceOutputType(file.type);
  // Carga diferida: la librería solo se descarga al elegir una foto.
  const { default: imageCompression } = await import(
    "browser-image-compression"
  );

  let compressed: Blob;
  try {
    compressed = await imageCompression(
      new File([file], evidenceFileName(file.type), { type: file.type }),
      {
        maxSizeMB: EVIDENCE_TARGET_MB,
        maxWidthOrHeight: EVIDENCE_MAX_SIDE_PX,
        fileType: outputType,
        useWebWorker: true,
      },
    );
  } catch {
    throw new EvidenceImageError(
      "No se pudo procesar la imagen. Intenta con otra foto.",
    );
  }

  if (compressed.size > EVIDENCE_API_LIMIT_BYTES) {
    throw new EvidenceImageError(
      "La imagen sigue pesando más de 2 MB. Intenta con otra foto.",
    );
  }

  return new File([compressed], evidenceFileName(outputType), {
    type: outputType,
  });
};

export const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
