"use client";

import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { DashboardService } from "@services";
import { EVIDENCE_STATUS_COLOR } from "@shared/constants/semanticTones";
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

const AssignedResponsibleChart = ({ filters }: Props) => {
  const theme = useTheme();
  const { data: chartData = null } = useDashboardQuery(
    "assigned-responsibles",
    DashboardService.findAssignedResponsiblesByFilters,
    filters,
  );

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  const categories = useMemo(() => chartData?.categories || [], [chartData]);
  const series = useMemo(
    () =>
      (chartData?.series || []).map((item) => ({
        ...item,
        type: "bar" as const,
        // Cada estatus con su color del sistema.
        color: EVIDENCE_STATUS_COLOR[item.name]?.main,
      })),
    [chartData],
  );

  const categoriesWithTotals = useMemo(
    () =>
      categories.map((responsibleName, index) => {
        const totalByResponsible = series.reduce((acc, currentSeries) => {
          return acc + Number(currentSeries.data[index] || 0);
        }, 0);

        return `${responsibleName} (${totalByResponsible.toLocaleString("es-MX")})`;
      }),
    [categories, series],
  );

  const chartHeight = useMemo(
    () => Math.max(520, categoriesWithTotals.length * 34 + 180),
    [categoriesWithTotals.length],
  );

  return (
    <Chart
      highcharts={Highcharts}
      containerProps={{ style: { height: `${chartHeight}px` } }}
      options={
        {
          ...optionsChartDefault,
          chart: {
            type: "bar",
            height: chartHeight,
            backgroundColor: "transparent",
            plotBackgroundColor: "transparent",
          },
          title: {
            text: (() => {
              const titleParts = ["Hallazgos por responsable"];

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
              ? `Planta: <b>${filters.manufacturingPlantName || "-"}</b> - Fecha inicio: <b>${filters.startDate}</b> - Fecha fin: <b>${filters.endDate}</b>`
              : "Seleccione planta, fecha inicio y fecha fin",
            style: {
              color: chartSubtleTextColor,
            },
          },
          xAxis: {
            categories: categoriesWithTotals,
            title: {
              text: null,
            },
            gridLineWidth: 1,
            lineWidth: 0,
            labels: {
              style: {
                color: chartTextColor,
              },
            },
          },
          yAxis: {
            min: 0,
            allowDecimals: false,
            tickInterval: 1,
            title: {
              text: "Número de hallazgos",
              align: "high",
              style: {
                color: chartTextColor,
              },
            },
            labels: {
              overflow: "justify",
              format: "{value:.0f}",
              style: {
                color: chartTextColor,
              },
            },
            gridLineWidth: 0,
          },
          tooltip: {
            headerFormat:
              '<span style="font-size: 10px">{point.key}</span><br/>',
            pointFormat: "{series.name}: <b>{point.y}</b><br/>",
            backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
            borderColor: chartBorderColor,
            style: {
              color: chartTextColor,
            },
          },
          plotOptions: {
            bar: {
              borderRadius: "50%",
              dataLabels: {
                enabled: true,
                formatter: function () {
                  return Number(this.y || 0).toLocaleString("es-MX");
                },
                style: {
                  color: chartTextColor,
                  textOutline: "none",
                },
              },
              groupPadding: 0.1,
            },
          },
          legend: {
            layout: "vertical",
            align: "right",
            verticalAlign: "top",
            x: -40,
            y: 80,
            floating: true,
            borderWidth: 1,
            borderColor: chartBorderColor,
            backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
            shadow: true,
            itemStyle: {
              color: chartTextColor,
            },
            itemHoverStyle: {
              color: chartSubtleTextColor,
            },
          },
          credits: {
            enabled: false,
          },
          series,
        } as Highcharts.Options
      }
    />
  );
};

export default AssignedResponsibleChart;
