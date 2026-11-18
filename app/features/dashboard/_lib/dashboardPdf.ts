// Informe PDF del dashboard. Las gráficas de Highcharts entran como vector
// (su SVG, con svg2pdf.js): nítidas al acercar o imprimir, con texto
// seleccionable y un archivo mucho más ligero. Antes cada gráfica era una
// imagen PNG (html2canvas): el informe pesaba ~45 MB y html2canvas dibujaba
// mal algunas tarjetas (bloques de color encima de las donas).
//
// Solo sigue como imagen (html2canvas, cargado solo si hace falta) lo que no
// es una gráfica de Highcharts: el mapa de calor sobre el plano.

import type { jsPDF } from "jspdf";
import Highcharts from "highcharts/esm/highcharts.src.js";

import { layoutPdfBlocks, PDF_LINE_HEIGHT, type PdfBlock } from "./dashboardPdfLayout";
import {
  isDarkBackground,
  PAPER_LINE,
  PAPER_PANE,
  parseColor,
  textColorForPaper,
} from "./pdfColors";

export interface DashboardPdfHeader {
  title: string;
  lines: string[];
  fileName: string;
}

type PreparedBlock = PdfBlock &
  (
    | {
        kind: "vector";
        chart: Highcharts.Chart;
        svg: SVGSVGElement;
        onDark: boolean;
        texts: string[];
      }
    | { kind: "image"; data: string }
  );

const MM_TO_PT = 72 / 25.4;

/** Gráfica de Highcharts dibujada dentro del bloque, si hay. */
const chartIn = (block: HTMLElement) =>
  Highcharts.charts.find(
    (chart): chart is Highcharts.Chart => !!chart && block.contains(chart.container),
  );

/** Texto de MUI del bloque fuera de la gráfica (p. ej. título y "Mes actual"). */
const textsOutside = (block: HTMLElement, chart: Highcharts.Chart) =>
  Array.from(block.querySelectorAll<HTMLElement>(".MuiTypography-root"))
    .filter((element) => !chart.container.contains(element))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean);

/**
 * Copia del SVG con el tamaño, grosor y color de cada texto ya calculados en
 * px. Highcharts 12 los da en `em` (relativos al contenedor) y svg2pdf, fuera
 * de la página, los resolvía como 0: el texto quedaba invisible. Helvetica es
 * la fuente estándar del PDF (con acentos y ñ).
 *
 * El papel es blanco: si la gráfica se dibujó en modo oscuro, el fondo pasa a
 * blanco y los textos y líneas claros, a tonos oscuros (en el PDF casi no se
 * leían).
 */
/**
 * Color de fondo que se ve detrás del elemento: el primero no transparente
 * subiendo por sus contenedores (las gráficas tienen fondo transparente y el
 * color lo pone la tarjeta de MUI).
 */
const visibleBackground = (element: Element) => {
  for (let node: Element | null = element; node; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor;
    const alpha = color.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1];
    if (color && color !== "transparent" && (alpha === undefined || Number(alpha) > 0.5))
      return color;
  }
  return "rgb(255, 255, 255)";
};

const svgForPdf = (svg: SVGSVGElement) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const onDark = isDarkBackground(visibleBackground(svg));
  const live = svg.querySelectorAll<SVGElement>("text, tspan");
  const copies = clone.querySelectorAll<SVGElement>("text, tspan");
  live.forEach((element, index) => {
    const style = getComputedStyle(element);
    const copy = copies[index];
    copy.style.fontSize = style.fontSize;
    copy.style.fontWeight = style.fontWeight;
    copy.style.fill = onDark ? textColorForPaper(style.fill) : style.fill;
    copy.style.fontFamily = "helvetica";
  });
  if (onDark) {
    clone
      .querySelectorAll(".highcharts-background, .highcharts-plot-background")
      .forEach((element) => element.setAttribute("fill", "#ffffff"));
    clone
      .querySelectorAll(".highcharts-grid-line, .highcharts-axis-line, .highcharts-tick")
      .forEach((element) => element.setAttribute("stroke", PAPER_LINE));
    // Fondo de los arcos de los KPI (gauge) y caja de la leyenda: oscuros
    // para la pantalla, pesados en papel.
    clone.querySelectorAll(".highcharts-pane, .highcharts-legend-box").forEach((element) => {
      if (isDarkBackground(element.getAttribute("fill"))) element.setAttribute("fill", PAPER_PANE);
      if (element.getAttribute("stroke")) element.setAttribute("stroke", PAPER_LINE);
    });
  }
  return { svg: clone, onDark };
};

const rgb = (color: string): [number, number, number] => parseColor(color) ?? [0, 0, 0];

const isShown = (element: HTMLElement, until: HTMLElement) => {
  for (let node: HTMLElement | null = element; node && node !== until; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)
      return false;
  }
  return true;
};

/**
 * Etiquetas HTML de Highcharts (useHTML: el "Total" de las donas, burbujas,
 * KPI): viven en <div> junto al SVG, no dentro. Se escriben como texto del
 * PDF en su posición, tamaño, grosor y color.
 */
const drawHtmlLabels = (
  pdf: jsPDF,
  chart: Highcharts.Chart,
  place: { x: number; y: number; width: number },
  onDark: boolean,
) => {
  const box = chart.container.getBoundingClientRect();
  if (!box.width) return;
  const scale = place.width / box.width;

  for (const holder of Array.from(chart.container.children)) {
    if (holder.tagName.toLowerCase() === "svg" || !(holder instanceof HTMLElement)) continue;
    const leaves = [holder, ...Array.from(holder.querySelectorAll<HTMLElement>("*"))].filter(
      (element) => element.childElementCount === 0 && element.textContent?.trim(),
    );
    for (const leaf of leaves) {
      const rect = leaf.getBoundingClientRect();
      if (!rect.width || !isShown(leaf, chart.container)) continue;
      const style = getComputedStyle(leaf);
      const bold = style.fontWeight === "bold" || Number(style.fontWeight) >= 600;
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(parseFloat(style.fontSize) * scale * MM_TO_PT);
      pdf.setTextColor(...rgb(onDark ? textColorForPaper(style.color) : style.color));
      pdf.text(
        leaf.textContent!.trim(),
        place.x + (rect.left + rect.width / 2 - box.left) * scale,
        place.y + (rect.top - box.top + rect.height * 0.78) * scale,
        { align: "center" },
      );
    }
  }
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Espera a que las gráficas terminen de animarse (las barras crecen y las
 * donas se dibujan desde cero al cargar o al cambiar un filtro): capturadas a
 * medias salían cortas o vacías. Luego un momento más para que aparezcan las
 * etiquetas de datos, que se muestran al final. Máximo ~3 s.
 */
const waitForAnimations = async (charts: Highcharts.Chart[]) => {
  const animating = () =>
    charts.some((chart) =>
      chart.series.some(
        (series) =>
          series.visible && !(series as { finishedAnimating?: boolean }).finishedAnimating,
      ),
    );
  for (let waited = 0; animating() && waited < 3000; waited += 100) await sleep(100);
  await sleep(400);
};

export async function downloadDashboardPdf(blocks: HTMLElement[], header: DashboardPdfHeader) {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);
  let html2canvas: (typeof import("html2canvas"))["default"] | null = null;

  await waitForAnimations(
    blocks.map(chartIn).filter((chart): chart is Highcharts.Chart => !!chart),
  );

  const prepared: PreparedBlock[] = [];
  for (const block of blocks) {
    const chart = chartIn(block);
    const svg = chart?.container.querySelector("svg");
    if (chart && svg) {
      const texts = textsOutside(block, chart);
      const forPdf = svgForPdf(svg);
      prepared.push({
        kind: "vector",
        chart,
        svg: forPdf.svg,
        onDark: forPdf.onDark,
        texts,
        width: chart.chartWidth,
        height: chart.chartHeight,
        textLines: texts.length,
      });
      continue;
    }
    html2canvas ??= (await import("html2canvas")).default;
    const canvas = await html2canvas(block, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    prepared.push({
      kind: "image",
      // JPEG de alta calidad: un PNG de este tamaño pesa varios MB.
      data: canvas.toDataURL("image/jpeg", 0.92),
      width: canvas.width,
      height: canvas.height,
      textLines: 0,
    });
  }

  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const margin = 10;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(16);
  pdf.text(header.title, margin, margin + 2);
  pdf.setFontSize(10);
  let headerY = margin + 10;
  for (const line of header.lines) {
    const wrapped: string[] = pdf.splitTextToSize(line, pageWidth - margin * 2);
    pdf.text(wrapped, margin, headerY);
    headerY += wrapped.length * 4 + 2;
  }

  const placements = layoutPdfBlocks(prepared, {
    width: pageWidth,
    height: pageHeight,
    margin,
    firstY: headerY + 2,
  });

  let currentPage = 0;
  for (const [index, block] of prepared.entries()) {
    const place = placements[index];
    while (currentPage < place.page) {
      pdf.addPage();
      currentPage += 1;
    }
    if (block.kind === "vector") {
      pdf.setFontSize(11);
      block.texts.forEach((text, line) =>
        pdf.text(text, margin, place.textY + PDF_LINE_HEIGHT * (line + 1) - 1),
      );
      await svg2pdf(block.svg, pdf, {
        x: place.x,
        y: place.y,
        width: place.width,
        height: place.height,
      });
      drawHtmlLabels(pdf, block.chart, place, block.onDark);
    } else {
      pdf.addImage(block.data, "JPEG", place.x, place.y, place.width, place.height);
    }
  }

  pdf.save(header.fileName);
}
