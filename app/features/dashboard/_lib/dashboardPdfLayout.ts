// Acomodo de las gráficas del informe PDF del dashboard en páginas A4.
// Sin DOM ni jsPDF: solo medidas en mm, para poder probarlo aparte.

export interface PdfPage {
  width: number;
  height: number;
  margin: number;
  /** Primera altura libre de la primera página (debajo del encabezado). */
  firstY: number;
}

/** Bloque a colocar: tamaño original (cualquier unidad) y renglones de texto encima. */
export interface PdfBlock {
  width: number;
  height: number;
  textLines: number;
}

export interface PdfPlacement {
  /** 0 = primera página. */
  page: number;
  /** Donde empieza el texto del bloque (si tiene). */
  textY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PDF_LINE_HEIGHT = 5;
const GAP = 6;
const MAX_PER_PAGE = 2;
// Con menos espacio que esto al pie de una página, el bloque empieza en otra.
const MIN_SPACE = 40;

/**
 * Mismas reglas que el informe anterior: a lo ancho de la página, hasta dos
 * por página; si no cabe y queda poco espacio, a la siguiente; si aun así no
 * cabe, se reduce conservando la proporción.
 */
export const layoutPdfBlocks = (blocks: PdfBlock[], page: PdfPage): PdfPlacement[] => {
  const maxWidth = page.width - page.margin * 2;
  const bottom = page.height - page.margin;
  let pageIndex = 0;
  let y = page.firstY;
  let inPage = 0;

  const newPage = () => {
    pageIndex += 1;
    y = page.margin;
    inPage = 0;
  };

  return blocks.map((block) => {
    if (inPage >= MAX_PER_PAGE) newPage();

    const textHeight = block.textLines * PDF_LINE_HEIGHT;
    let width = maxWidth;
    let height = (block.height * width) / block.width;

    if (height > bottom - y - textHeight && bottom - y - textHeight < MIN_SPACE && inPage > 0) {
      newPage();
    }
    const available = bottom - y - textHeight;
    if (height > available) {
      height = available;
      width = (block.width * height) / block.height;
    }

    const placement: PdfPlacement = {
      page: pageIndex,
      textY: y,
      x: (page.width - width) / 2,
      y: y + textHeight,
      width,
      height,
    };
    y += textHeight + height + GAP;
    inPage += 1;
    return placement;
  });
};
