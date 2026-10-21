"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/highcharts-more.src.js";
import "highcharts/esm/modules/accessibility.src.js";

import { ResponseDashboardAreaRangeLineByFilters } from "@interfaces";
import { DashboardService } from "@services";
import { optionsChartDefault } from "@shared/libs";

interface Props {
  filters: {
    manufacturingPlantId: string;
    manufacturingPlantName: string;
    startDate: string;
    endDate: string;
    areaIds: string[];
    areaNames: string[];
    responsibleIds: string[];
    responsibleNames: string[];
    mainTypeIds: string[];
    mainTypeNames: string[];
  };
}

const AreaRangeLineChart = ({ filters }: Props) => {
  const theme = useTheme();
  const [chartData, setChartData] =
    useState<ResponseDashboardAreaRangeLineByFilters | null>(null);

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  useEffect(() => {
    if (!hasCompleteFilters) {
      setChartData(null);
      return;
    }

    DashboardService.findAreaRangeLineByFilters({
      manufacturingPlantId: filters.manufacturingPlantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.areaIds.length > 0 && { areaIds: filters.areaIds }),
      ...(filters.responsibleIds.length > 0 && {
        responsibleIds: filters.responsibleIds,
      }),
      ...(filters.mainTypeIds.length > 0 && {
        mainTypeIds: filters.mainTypeIds,
      }),
    }).then(setChartData);
  }, [
    hasCompleteFilters,
    filters.manufacturingPlantId,
    filters.startDate,
    filters.endDate,
    filters.areaIds,
    filters.responsibleIds,
    filters.mainTypeIds,
  ]);

  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  const formatMonthYearEs = (value: string) => {
    const [yearText, monthText] = value.split("-");
    const year = Number(yearText);
    const month = Number(monthText);

    if (!year || !month) {
      return value;
    }

    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <Chart
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%" } }}
      options={
        {
          ...optionsChartDefault,
          chart: {
            type: "line",
            height: 430,
            backgroundColor: "transparent",
            plotBackgroundColor: "transparent",
          },
          title: {
            text: (() => {
              const titleParts = [
                "Proyección mensual de hallazgos con rango esperado",
              ];

              if (filters.areaNames.length > 0) {
                titleParts.push(filters.areaNames.join(", "));
              }

              if (filters.responsibleNames.length > 0) {
                titleParts.push(filters.responsibleNames.join(", "));
              }

              if (filters.mainTypeNames.length > 0) {
                titleParts.push(filters.mainTypeNames.join(", "));
              }

              return titleParts.join(" - ");
            })(),
            style: {
              color: chartTextColor,
            },
          },
          subtitle: {
            text: hasCompleteFilters
              ? `Planta: <b>${filters.manufacturingPlantName || "-"}</b> - Fecha inicio: <b>${filters.startDate}</b> - Fecha fin: <b>${filters.endDate}</b> - Horizonte: <b>${chartData?.forecastHorizonMonths || 0} meses</b>`
              : "Seleccione planta, fecha inicio y fecha fin",
            style: {
              color: chartSubtleTextColor,
            },
          },
          xAxis: {
            categories: chartData?.categories || [],
            crosshair: true,
            labels: {
              formatter: function () {
                return formatMonthYearEs(String(this.value));
              },
              style: {
                color: chartTextColor,
              },
            },
          },
          yAxis: {
            min: 0,
            allowDecimals: false,
            title: {
              text: "Hallazgos",
              style: {
                color: chartTextColor,
              },
            },
            labels: {
              style: {
                color: chartTextColor,
              },
            },
          },
          tooltip: {
            shared: true,
            valueDecimals: 0,
            backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
            borderColor: chartBorderColor,
            style: {
              color: chartTextColor,
            },
          },
          legend: {
            enabled: true,
            itemStyle: {
              color: chartTextColor,
            },
            itemHoverStyle: {
              color: chartSubtleTextColor,
            },
          },
          plotOptions: {
            series: {
              marker: {
                enabled: false,
              },
            },
            arearange: {
              lineWidth: 0,
            },
          },
          credits: {
            enabled: false,
          },
          series: [
            {
              type: "line",
              name: "Historico",
              data: chartData?.actualSeries || [],
              color: "#2563eb",
              lineWidth: 3,
              zIndex: 3,
            },
            {
              type: "line",
              name: "Proyeccion",
              data: chartData?.forecastSeries || [],
              color: "#f59e0b",
              dashStyle: "ShortDash",
              lineWidth: 3,
              zIndex: 4,
            },
            {
              type: "arearange",
              name: "Rango esperado",
              // Los meses sin rango llegan en null; Highcharts truena al
              // actualizar un arearange con null y espera [null, null].
              data: (chartData?.rangeSeries || []).map(
                (point) => point ?? [null, null],
              ),
              color: "rgba(59, 130, 246, 0.22)",
              fillOpacity: 0.22,
              zIndex: 1,
            },
          ],
        } as Highcharts.Options
      }
    />
  );
};

export default AreaRangeLineChart;
