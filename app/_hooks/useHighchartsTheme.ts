"use client";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { lighten, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

// Paletas de series que ya usaba el sistema en cada modo.
const SERIES_COLORS = {
  light: [
    "#7cb5ec",
    "#434348",
    "#90ed7d",
    "#f7a35c",
    "#8085e9",
    "#f15c80",
    "#e4d354",
    "#2b908f",
    "#f45b5b",
    "#91e8e1",
    "#aaeeee",
  ],
  dark: [
    "#f45b5b",
    "#8085e9",
    "#8d4654",
    "#7798BF",
    "#aaeeee",
    "#ff0066",
    "#eeaaee",
    "#55BF3B",
    "#DF5353",
    "#7798BF",
    "#aaeeee",
  ],
};

const themeOptions = (theme: Theme): Highcharts.Options => {
  const { mode, text, divider, background } = theme.palette;
  const axis = {
    labels: { style: { color: text.secondary } },
    title: { style: { color: text.secondary } },
    lineColor: divider,
    tickColor: divider,
    gridLineColor: divider,
  };

  return {
    chart: {
      // Igual al Paper que contiene la gráfica (en oscuro, MUI lo aclara
      // ligeramente por la elevación).
      backgroundColor:
        mode === "dark" ? lighten(background.paper, 0.05) : background.paper,
    },
    title: { style: { color: text.primary } },
    subtitle: { style: { color: text.secondary } },
    legend: {
      itemStyle: { color: text.primary },
      itemHoverStyle: { color: text.secondary },
    },
    xAxis: axis,
    yAxis: axis,
    // Botón del menú de exportación (por defecto con fondo blanco).
    navigation: {
      buttonOptions: {
        symbolStroke: text.secondary,
        theme: { fill: "transparent" },
      },
    },
    colors: SERIES_COLORS[mode],
  };
};

// Aplica el tema de MUI (claro u oscuro) a Highcharts y devuelve el modo.
// Highcharts solo usa las opciones globales al crear una gráfica, así que se
// aplican durante el render, antes de que se monten las gráficas hijas, y la
// página usa el modo como `key` de su contenido para volver a crearlas al
// cambiar de tema (antes se recargaba toda la página). Solo se aplican si el
// fondo configurado no corresponde al modo actual.
export function useHighchartsTheme() {
  const theme = useTheme();
  const mode = theme.palette.mode;

  if (typeof window !== "undefined") {
    const options = themeOptions(theme);
    const current = Highcharts.getOptions().chart?.backgroundColor;

    if (current !== options.chart?.backgroundColor) {
      Highcharts.setOptions(options);
    }
  }

  return mode;
}
