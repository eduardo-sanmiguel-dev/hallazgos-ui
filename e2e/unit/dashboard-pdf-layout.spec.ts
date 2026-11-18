import { describe, expect, test } from "vite-plus/test";

import {
  layoutPdfBlocks,
  PDF_LINE_HEIGHT,
  type PdfBlock,
} from "../../app/features/dashboard/_lib/dashboardPdfLayout";

// A4 vertical en mm, como el informe del dashboard.
const A4 = { width: 210, height: 297, margin: 10, firstY: 40 };
const wide = (textLines = 0): PdfBlock => ({ width: 1000, height: 500, textLines });

describe("Informe PDF del dashboard: acomodo en páginas", () => {
  test("a lo ancho de la página, centrado y con su proporción", () => {
    const [place] = layoutPdfBlocks([wide()], A4);

    expect(place).toMatchObject({ page: 0, x: 10, y: 40, width: 190, height: 95 });
  });

  test("dos gráficas por página como máximo", () => {
    const pages = layoutPdfBlocks([wide(), wide(), wide(), wide(), wide()], A4).map(
      (place) => place.page,
    );

    expect(pages).toEqual([0, 0, 1, 1, 2]);
  });

  test("el texto que acompaña a la gráfica va encima y la desplaza", () => {
    const [place] = layoutPdfBlocks([wide(2)], A4);

    expect(place.textY).toBe(40);
    expect(place.y).toBe(40 + 2 * PDF_LINE_HEIGHT);
  });

  test("una gráfica alta se reduce para caber, conservando la proporción", () => {
    const [place] = layoutPdfBlocks([{ width: 500, height: 2000, textLines: 0 }], A4);

    // Cabe en lo que queda de la página (297 - 10 - 40) y se centra.
    expect(place.height).toBeCloseTo(247);
    expect(place.width).toBeCloseTo(247 / 4);
    expect(place.x).toBeCloseTo((210 - 247 / 4) / 2);
  });

  test("si no cabe y queda poco espacio, empieza en la página siguiente", () => {
    const tall = { width: 1000, height: 1100, textLines: 0 };
    const places = layoutPdfBlocks([tall, tall], A4);

    expect(places.map((place) => place.page)).toEqual([0, 1]);
    expect(places[1].y).toBe(A4.margin);
  });

  test("ningún bloque se sale del pie de la página", () => {
    const places = layoutPdfBlocks(
      [wide(1), { width: 300, height: 900, textLines: 3 }, wide(), wide(2)],
      A4,
    );

    for (const place of places) {
      expect(place.y + place.height).toBeLessThanOrEqual(A4.height - A4.margin + 1e-9);
    }
  });
});
