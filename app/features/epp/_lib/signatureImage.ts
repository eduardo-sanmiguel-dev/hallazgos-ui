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

/** Límites del trazo: no depende del módulo CommonJS trim-canvas. */
export const signatureInkBounds = (pixels: Uint8ClampedArray, width: number, height: number) => {
  let left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
};

/** PNG recortado, transparente y reducido a partir del lienzo original. */
export const exportSignature = (canvas: HTMLCanvasElement) => {
  const source = canvas.getContext("2d");
  if (!source) return canvas.toDataURL("image/png");
  const pixels = source.getImageData(0, 0, canvas.width, canvas.height).data;
  const bounds = signatureInkBounds(pixels, canvas.width, canvas.height);
  if (!bounds) return canvas.toDataURL("image/png");
  const size = signatureOutputSize(bounds.width, bounds.height);
  const output = document.createElement("canvas");
  output.width = size.width;
  output.height = size.height;
  const context = output.getContext("2d");
  if (!context) return canvas.toDataURL("image/png");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    canvas,
    bounds.left,
    bounds.top,
    bounds.width,
    bounds.height,
    SIGNATURE_MARGIN,
    SIGNATURE_MARGIN,
    size.inkWidth,
    size.inkHeight,
  );
  return output.toDataURL("image/png");
};
