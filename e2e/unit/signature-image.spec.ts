import { describe, expect, test } from "vite-plus/test";
import {
  signatureInkBounds,
  signatureOutputSize,
} from "../../app/features/epp/_lib/signatureImage";

describe("Firma: recorte independiente del empaquetador", () => {
  test("un lienzo vacío no tiene límites de trazo", () => {
    expect(signatureInkBounds(new Uint8ClampedArray(4 * 3 * 4), 4, 3)).toBeNull();
  });
  test("incluye píxeles semitransparentes y los bordes inferior y derecho", () => {
    const pixels = new Uint8ClampedArray(4 * 3 * 4);
    pixels[(1 * 4 + 2) * 4 + 3] = 1;
    pixels[(2 * 4 + 3) * 4 + 3] = 255;
    expect(signatureInkBounds(pixels, 4, 3)).toEqual({ left: 2, top: 1, width: 2, height: 2 });
  });
  test("reduce firmas de alta densidad y conserva el margen transparente", () => {
    expect(signatureOutputSize(1800, 600)).toEqual({
      inkWidth: 552,
      inkHeight: 184,
      width: 568,
      height: 200,
    });
    expect(signatureOutputSize(1, 1)).toEqual({ inkWidth: 1, inkHeight: 1, width: 17, height: 17 });
  });
});
