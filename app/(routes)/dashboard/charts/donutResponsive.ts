import type Highcharts from "highcharts/esm/highcharts.src.js";

// Donas (estatus, zona, clasificación) en pantallas angostas (celular): las
// etiquetas de afuera encogían la dona y se cortaban ("Incumplimi…"). Sin
// ellas, la dona usa el ancho disponible y la leyenda lleva el nombre, la
// cantidad y el porcentaje; con muchas opciones (p. ej. zonas) la leyenda
// pagina con flechas en lugar de comerse el alto de la dona. Reemplaza la
// regla de optionsChartDefault, así que también lleva la leyenda abajo y
// centrada.
export const donutResponsive: Highcharts.ResponsiveOptions = {
  rules: [
    {
      condition: { maxWidth: 500 },
      chartOptions: {
        chart: { height: 460 },
        plotOptions: {
          series: { dataLabels: [{ enabled: false }] },
        },
        legend: {
          layout: "horizontal",
          align: "center",
          verticalAlign: "bottom",
          labelFormat: "{name}: {y} ({percentage:.0f}%)",
          maxHeight: 120,
        },
      },
    },
  ],
};
