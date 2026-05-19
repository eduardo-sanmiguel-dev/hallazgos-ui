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
  credits: {
    enabled: false,
    text: "Cosmeticos trujillo",
    href: 'javascript:window.open("https://cosmeticostrujillo.com", "_blank")',
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
