import { expect, test } from "@playwright/test";
import {
  decomposeColor,
  getContrastRatio,
  lighten,
  recomposeColor,
} from "@mui/material/styles";

import {
  BRAND_PRIMARY,
  createAppTheme,
  ERROR_TEXT_ON_DARK,
  primaryAccentBorder,
  primarySoftBackground,
  primaryTextColor,
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

  test("en oscuro el texto de marca también se lee", () => {
    for (const name of ["dark"] as const) {
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

test.describe("Contraste del tema oscuro", () => {
  // Papel de un diálogo en oscuro: MUI lo aclara con la elevación 24 (16 %
  // de blanco encima del fondo).
  const dialogPaper = (paper: string) => lighten(paper, 0.16);

  for (const name of ["dark"] as const) {
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

/** Color semitransparente `top` compuesto sobre el fondo opaco `base`. */
const blend = (base: string, top: string) => {
  const b = decomposeColor(base).values;
  const { values: t } = decomposeColor(top);
  const a = t[3] ?? 1;
  return recomposeColor({
    type: "rgb",
    values: [0, 1, 2].map((i) => Math.round(t[i] * a + b[i] * (1 - a))) as [
      number,
      number,
      number,
    ],
  });
};

test.describe("Encabezados (tablas y barra del detalle de hallazgo)", () => {
  for (const name of ["light", "dark"] as const) {
    test(`${name}: el texto verde se lee sobre el verde tenue`, () => {
      const theme = createAppTheme(name);
      // El tono es semitransparente: se compone sobre el papel.
      const background = blend(
        theme.palette.background.paper,
        primarySoftBackground(theme),
      );
      expect(
        getContrastRatio(primaryTextColor(theme), background),
      ).toBeGreaterThanOrEqual(AA);
      expect(primaryAccentBorder(theme)).toBe(
        `2px solid ${theme.palette.primary.main}`,
      );
    });
  }
});
