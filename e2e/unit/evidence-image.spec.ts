import { expect, test } from "@playwright/test";

import {
  evidenceFileName,
  evidenceOutputType,
  formatFileSize,
} from "../../app/_shared/utils/evidenceImage";

// El API solo acepta JPG, PNG o WEBP y revisa que el contenido coincida.

test.describe("Imagen de evidencia", () => {
  test("PNG y WEBP se conservan; lo demás sale como JPG", () => {
    expect(evidenceOutputType("image/png")).toBe("image/png");
    expect(evidenceOutputType("image/webp")).toBe("image/webp");
    for (const type of ["image/jpeg", "image/heic", "image/gif", ""]) {
      expect(evidenceOutputType(type), type).toBe("image/jpeg");
    }
  });

  test("la extensión coincide con el tipo", () => {
    const now = new Date(1_700_000_000_000);
    expect(evidenceFileName("image/jpeg", now)).toBe(
      "evidencia-1700000000000.jpg",
    );
    expect(evidenceFileName("image/png", now)).toBe(
      "evidencia-1700000000000.png",
    );
    expect(evidenceFileName("image/webp", now)).toBe(
      "evidencia-1700000000000.webp",
    );
  });

  test("tamaño legible", () => {
    expect(formatFileSize(300)).toBe("1 KB");
    expect(formatFileSize(512 * 1024)).toBe("512 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
