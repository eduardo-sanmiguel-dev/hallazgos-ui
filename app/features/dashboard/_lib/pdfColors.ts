// Colores del informe PDF: el papel es blanco aunque la pantalla esté en modo
// oscuro. En oscuro, los textos y líneas de las gráficas son claros (pensados
// para fondo oscuro) y en el PDF casi no se veían; se pasan a tonos oscuros.
// Sin DOM: se puede probar aparte.

type Rgb = [number, number, number];

/** "rgb(…)", "rgba(…)" o "#rrggbb" / "#rgb"; null si no se reconoce. */
export const parseColor = (color: string | null | undefined): Rgb | null => {
  if (!color) return null;
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const value =
      hex[1].length === 3
        ? hex[1]
            .split("")
            .map((c) => c + c)
            .join("")
        : hex[1];
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;
  }
  const numbers = color
    .match(/rgba?\(([^)]+)\)/i)?.[1]
    .split(/[\s,/]+/)
    .filter(Boolean);
  if (!numbers || numbers.length < 3) return null;
  return numbers.slice(0, 3).map(Number) as Rgb;
};

/** Luminancia relativa (WCAG): 0 = negro, 1 = blanco. */
export const luminance = ([r, g, b]: Rgb) => {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** La gráfica se dibujó para fondo oscuro (modo oscuro de la app). */
export const isDarkBackground = (color: string | null | undefined) => {
  const rgb = parseColor(color);
  return !!rgb && luminance(rgb) < 0.2;
};

// Tonos del tema claro para texto principal y secundario.
export const PAPER_TEXT = "rgb(17, 24, 39)";
export const PAPER_TEXT_SECONDARY = "rgb(75, 85, 99)";
export const PAPER_LINE = "rgb(224, 224, 224)";
export const PAPER_PANE = "rgb(238, 238, 238)";

/**
 * Texto legible sobre papel blanco: los claros (los del modo oscuro) pasan a
 * oscuros; los que ya se leen en blanco (colores de series, oscuros) quedan.
 */
export const textColorForPaper = (color: string) => {
  const rgb = parseColor(color);
  if (!rgb) return color;
  const light = luminance(rgb);
  if (light < 0.3) return color;
  return light > 0.7 ? PAPER_TEXT : PAPER_TEXT_SECONDARY;
};
