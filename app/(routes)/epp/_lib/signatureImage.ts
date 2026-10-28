// Firma que se guarda: recortada al trazo, transparente y de 600 × 200 px como
// máximo. El lienzo trabaja a la densidad de la pantalla (en un celular 3x una
// firma horizontal pesaba ~100 KB, el límite del API) y con fondo blanco
// tapaba los bordes de la celda en el formato de Excel. El fondo blanco se
// pone solo al mostrarla.
export const SIGNATURE_MAX_WIDTH = 600;
export const SIGNATURE_MAX_HEIGHT = 200;
// Margen transparente alrededor del trazo para no cortar las orillas.
export const SIGNATURE_MARGIN = 8;

/** Medidas de salida: el trazo reducido (nunca ampliado) más el margen. */
export const signatureOutputSize = (width: number, height: number) => {
  const scale = Math.min(
    1,
    (SIGNATURE_MAX_WIDTH - 2 * SIGNATURE_MARGIN) / width,
    (SIGNATURE_MAX_HEIGHT - 2 * SIGNATURE_MARGIN) / height,
  );
  const inkWidth = Math.max(1, Math.round(width * scale));
  const inkHeight = Math.max(1, Math.round(height * scale));
  return {
    inkWidth,
    inkHeight,
    width: inkWidth + 2 * SIGNATURE_MARGIN,
    height: inkHeight + 2 * SIGNATURE_MARGIN,
  };
};

/** PNG (data URL) de la firma a partir del lienzo ya recortado al trazo. */
export const exportSignature = (trimmed: HTMLCanvasElement) => {
  const size = signatureOutputSize(trimmed.width, trimmed.height);
  const output = document.createElement("canvas");
  output.width = size.width;
  output.height = size.height;
  const context = output.getContext("2d");
  if (!context) return trimmed.toDataURL("image/png");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    trimmed,
    SIGNATURE_MARGIN,
    SIGNATURE_MARGIN,
    size.inkWidth,
    size.inkHeight,
  );
  return output.toDataURL("image/png");
};
