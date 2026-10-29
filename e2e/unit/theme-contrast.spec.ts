import { expect, test } from "@playwright/test";
import { getContrastRatio, lighten } from "@mui/material/styles";

import {
  BRAND_PRIMARY,
  createAppTheme,
  ERROR_TEXT_ON_DARK,
} from "../../app/theme";

// Contraste AA (4.5:1) del tema claro, que es el que se usa al sol en planta
// (A3 de docs/ux-auditoria.md).

const AA = 4.5;
const light = createAppTheme("light");
const white = light.palette.background.paper;

test.describe("Contraste del tema claro", () => {
  test("el verde para texto e íconos cumple AA sobre blanco y gris", () => {
    const brand = light.palette.text.brand;
    expect(getContrastRatio(brand, white)).toBeGreaterThanOrEqual(AA);
    expect(
      getContrastRatio(brand, light.palette.grey[100]),
    ).toBeGreaterThanOrEqual(AA);
  });

  test("el verde de marca no cambia en rellenos", () => {
    expect(light.palette.primary.main).toBe(BRAND_PRIMARY);
    expect(
      getContrastRatio(light.palette.primary.contrastText, BRAND_PRIMARY),
    ).toBeGreaterThanOrEqual(AA);
  });

  for (const tone of ["success", "warning", "info", "error"] as const) {
    test(`${tone}: texto sobre su relleno y como texto sobre blanco`, () => {
      const { main, contrastText } = light.palette[tone];
      expect(getContrastRatio(contrastText, main)).toBeGreaterThanOrEqual(AA);
      expect(getContrastRatio(main, white)).toBeGreaterThanOrEqual(AA);
    });
  }

  test("en oscuro y halloween el texto de marca también se lee", () => {
    for (const name of ["dark", "halloween"] as const) {
      const theme = createAppTheme(name);
      expect(
        getContrastRatio(
          theme.palette.text.brand,
          theme.palette.background.paper,
        ),
        name,
      ).toBeGreaterThanOrEqual(AA);
    }
  });
});

test.describe("Contraste de los temas oscuros", () => {
  // Papel de un diálogo en oscuro: MUI lo aclara con la elevación 24 (16 %
  // de blanco encima del fondo).
  const dialogPaper = (paper: string) => lighten(paper, 0.16);

  for (const name of ["dark", "halloween"] as const) {
    const theme = createAppTheme(name);
    const paper = theme.palette.background.paper;

    test(`${name}: el texto rojo de error se lee en campos y diálogos`, () => {
      for (const background of [
        paper,
        theme.palette.background.default,
        "#212121", // campo con relleno en oscuro
        dialogPaper(paper),
      ]) {
        expect(
          getContrastRatio(ERROR_TEXT_ON_DARK, background),
          background,
        ).toBeGreaterThanOrEqual(AA);
      }
    });

    test(`${name}: el botón relleno con el mouse encima se aclara y se lee`, () => {
      const { light, main, contrastText } = theme.palette.primary;
      expect(getContrastRatio(contrastText, light)).toBeGreaterThanOrEqual(AA);
      expect(getContrastRatio(contrastText, light)).toBeGreaterThanOrEqual(
        getContrastRatio(contrastText, main),
      );
    });
  }
});
