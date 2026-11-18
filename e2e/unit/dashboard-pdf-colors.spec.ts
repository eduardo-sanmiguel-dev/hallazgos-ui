import { describe, expect, test } from "vite-plus/test";

import {
  isDarkBackground,
  luminance,
  PAPER_TEXT,
  PAPER_TEXT_SECONDARY,
  parseColor,
  textColorForPaper,
} from "../../app/features/dashboard/_lib/pdfColors";

describe("Informe PDF del dashboard: colores sobre papel blanco", () => {
  test("lee rgb(), rgba() y hexadecimal", () => {
    expect(parseColor("rgb(255, 255, 255)")).toEqual([255, 255, 255]);
    expect(parseColor("rgba(17, 24, 39, 0.5)")).toEqual([17, 24, 39]);
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#1f2937")).toEqual([31, 41, 55]);
    expect(parseColor("transparent")).toBeNull();
    expect(parseColor(undefined)).toBeNull();
  });

  test("luminancia: negro 0 y blanco 1", () => {
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
  });

  test("detecta el fondo del modo oscuro (tarjeta) y no el claro", () => {
    expect(isDarkBackground("rgb(30, 30, 30)")).toBe(true);
    expect(isDarkBackground("rgb(255, 255, 255)")).toBe(false);
    expect(isDarkBackground("transparent")).toBe(false);
  });

  test("los textos claros del modo oscuro pasan a tonos oscuros", () => {
    // Texto principal (casi blanco) y secundario (gris claro) del tema oscuro.
    expect(textColorForPaper("rgb(255, 255, 255)")).toBe(PAPER_TEXT);
    expect(textColorForPaper("rgba(255, 255, 255, 0.7)")).toBe(PAPER_TEXT);
    expect(textColorForPaper("rgb(160, 170, 180)")).toBe(PAPER_TEXT_SECONDARY);
  });

  test("los textos que ya se leen en blanco no cambian (oscuros y de series)", () => {
    for (const color of ["rgb(17, 24, 39)", "rgb(185, 87, 11)", "rgb(30, 64, 175)"]) {
      expect(textColorForPaper(color)).toBe(color);
    }
    expect(textColorForPaper("inherit")).toBe("inherit");
  });
});
