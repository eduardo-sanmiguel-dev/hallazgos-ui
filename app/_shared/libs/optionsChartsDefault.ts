import { nowDateWithTime } from "@shared/utils";

export const optionsChartDefault = {
  subtitle: {
    text: nowDateWithTime(),
  },
  lang: {
    viewFullscreen: "Ver en pantalla completa",
    printChart: "Imprimir gráfica",
    downloadPNG: "Descargar imagen PNG",
    downloadJPEG: "Descargar imagen JPEG",
    downloadPDF: "Descargar documento PDF",
    downloadSVG: "Descargar imagen SVG",
  },
  // Sin enlace: era una URL `javascript:`, que la política de seguridad de
  // contenido (CSP) bloquea; Highcharts solo sabe abrir el enlace en la misma
  // pestaña, lo que sacaba al usuario del dashboard.
  credits: {
    enabled: true,
    text: "Hada international",
    href: "",
  },
  responsive: {
    rules: [
      {
        condition: {
          maxWidth: 500,
        },
        chartOptions: {
          legend: {
            layout: "horizontal",
            align: "center",
            verticalAlign: "bottom",
          },
        },
      },
    ],
  },
};
