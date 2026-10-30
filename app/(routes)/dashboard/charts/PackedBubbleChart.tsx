"use client";

import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";
import "highcharts/esm/highcharts-more.src.js";

import { DashboardService } from "@services";
import { useDashboardQuery } from "../_components/useDashboardSummary";
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

const PackedBubbleChart = ({ filters }: Props) => {
  const theme = useTheme();
  const { data: chartData = null } = useDashboardQuery(
    "packed-bubble",
    DashboardService.findPackedBubbleByFilters,
    filters,
  );

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  return (
    <Chart
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%" } }}
      options={
        {
          ...optionsChartDefault,
          chart: {
            type: "packedbubble",
            height: 520,
            backgroundColor: "transparent",
            plotBackgroundColor: "transparent",
          },
          title: {
            text: (() => {
              const titleParts = ["Burbujas por estatus y zonas"];

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
              ? `Planta: <b>${filters.manufacturingPlantName || "-"}</b> - Fecha inicio: <b>${filters.startDate}</b> - Fecha fin: <b>${filters.endDate}</b>${(chartData?.total || 0) === 0 ? " - Sin datos para los filtros seleccionados" : ""}`
              : "Seleccione planta, fecha inicio y fecha fin",
            style: {
              color: chartSubtleTextColor,
            },
          },
          tooltip: {
            useHTML: true,
            pointFormat:
              "<b>{point.name}</b><br/>Estatus: <b>{series.name}</b><br/>Hallazgos: <b>{point.value}</b>",
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
            packedbubble: {
              minSize: "25%",
              maxSize: "160%",
              zMin: 0,
              zMax: Math.max(
                1,
                ...(chartData?.series || []).flatMap((serie) =>
                  serie.data.map((point) => Number(point.value) || 0),
                ),
              ),
              layoutAlgorithm: {
                splitSeries: true,
                gravitationalConstant: 0.04,
                seriesInteraction: false,
                parentNodeLimit: true,
                enableSimulation: false,
              },
              dataLabels: {
                enabled: true,
                format: "{point.name}",
                filter: {
                  property: "value",
                  operator: ">",
                  value: 0,
                },
                style: {
                  color: chartTextColor,
                  textOutline: "none",
                },
              },
            },
            series: {
              animation: false,
            },
          },
          credits: {
            enabled: false,
          },
          series: (chartData?.series || []).map((serie) => ({
            type: "packedbubble",
            name: serie.name,
            data: serie.data.map((point) => ({
              name: point.name,
              value: point.value,
            })),
          })),
        } as Highcharts.Options
      }
    />
  );
};

export default PackedBubbleChart;
