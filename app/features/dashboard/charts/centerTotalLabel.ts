import type Highcharts from "highcharts/esm/highcharts.src.js";

type ChartWithCustomLabel = Highcharts.Chart & {
  customLabel?: Highcharts.SVGElement;
};

/**
 * Evento `render` de las donas del dashboard: el total al centro, del tamaño
 * proporcional al diámetro. Fuera de los componentes porque usa `this` (el
 * chart de Highcharts), que React Compiler no soporta: con él adentro, la
 * gráfica entera quedaba sin optimizar y se recalculaba en cada render.
 */
export const centerTotalLabel = (total: number, textColor: string) =>
  function render(this: Highcharts.Chart) {
    const chart = this as ChartWithCustomLabel;
    const series = chart.series[0];

    if (!series) return;

    let customLabel = chart.customLabel;
    const centerLabelHtml = `<div style="text-align:center; color:${textColor};"><span style="display:block;">Total</span><strong style="display:block;">${total.toLocaleString("es-MX")}</strong></div>`;

    if (!customLabel) {
      customLabel = chart.customLabel = chart.renderer
        .label(centerLabelHtml, 0, 0, undefined, undefined, undefined, true)
        .css({
          color: textColor,
          textAnchor: "middle",
        })
        .attr({
          zIndex: 7,
        })
        .add();
    }

    customLabel.attr({
      text: centerLabelHtml,
    });

    // Tamaño de letra según el diámetro de la dona.
    customLabel.css({
      fontSize: `${series.center[2] / 12}px`,
    });

    const labelBBox = customLabel.getBBox();
    const x = series.center[0] + chart.plotLeft - labelBBox.width / 2;
    const y = series.center[1] + chart.plotTop - labelBBox.height / 2;

    customLabel.attr({
      x,
      y,
    });
  };
