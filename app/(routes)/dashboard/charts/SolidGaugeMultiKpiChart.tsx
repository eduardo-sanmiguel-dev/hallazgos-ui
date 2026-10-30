"use client";

import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";
import "highcharts/esm/highcharts-more.src.js";
import "highcharts/esm/modules/solid-gauge.src.js";

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

const SolidGaugeMultiKpiChart = ({ filters }: Props) => {
  const theme = useTheme();
  const { data: kpiData = null } = useDashboardQuery(
    "solid-gauge-kpi",
    DashboardService.findSolidGaugeKpiByFilters,
    filters,
  );

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  const closurePercentage = Number(kpiData?.closurePercentage || 0);
  const avgResolutionDays = Number(kpiData?.avgResolutionDays || 0);
  const backlogActive = Number(kpiData?.backlogActive || 0);

  const avgResolutionMax = useMemo(
    () => Math.max(30, Math.ceil(avgResolutionDays * 1.25), 1),
    [avgResolutionDays],
  );

  const backlogMax = useMemo(
    () => Math.max(10, Math.ceil(backlogActive * 1.35), 1),
    [backlogActive],
  );

  return (
    <Chart
      highcharts={Highcharts}
      containerProps={{ style: { height: "100%" } }}
      options={
        {
          ...optionsChartDefault,
          chart: {
            type: "solidgauge",
            height: 430,
            backgroundColor: "transparent",
            plotBackgroundColor: "transparent",
          },
          title: {
            text: (() => {
              const titleParts = ["Tablero ejecutivo instantaneo"];

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
          tooltip: {
            borderWidth: 0,
            shadow: false,
            useHTML: true,
            pointFormat:
              '<span style="font-size:12px;color:' +
              chartTextColor +
              '">{series.name}: <b>{point.y}</b></span>',
            backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
            borderColor: chartBorderColor,
            style: {
              color: chartTextColor,
            },
          },
          pane: [
            {
              center: ["17%", "56%"],
              size: "85%",
              startAngle: -90,
              endAngle: 90,
              background: {
                outerRadius: "100%",
                innerRadius: "68%",
                shape: "arc",
                backgroundColor: isDarkMode ? "#1e293b" : "#e5e7eb",
                borderWidth: 0,
              },
            },
            {
              center: ["50%", "56%"],
              size: "85%",
              startAngle: -90,
              endAngle: 90,
              background: {
                outerRadius: "100%",
                innerRadius: "68%",
                shape: "arc",
                backgroundColor: isDarkMode ? "#1e293b" : "#e5e7eb",
                borderWidth: 0,
              },
            },
            {
              center: ["83%", "56%"],
              size: "85%",
              startAngle: -90,
              endAngle: 90,
              background: {
                outerRadius: "100%",
                innerRadius: "68%",
                shape: "arc",
                backgroundColor: isDarkMode ? "#1e293b" : "#e5e7eb",
                borderWidth: 0,
              },
            },
          ],
          yAxis: [
            {
              min: 0,
              max: 100,
              stops: [
                [0.0, "#ef4444"],
                [0.6, "#f59e0b"],
                [1.0, "#10b981"],
              ],
              lineWidth: 0,
              tickWidth: 0,
              minorTickInterval: undefined,
              tickAmount: 2,
              labels: { enabled: false },
              pane: 0,
            },
            {
              min: 0,
              max: avgResolutionMax,
              stops: [
                [0.0, "#10b981"],
                [0.6, "#f59e0b"],
                [1.0, "#ef4444"],
              ],
              lineWidth: 0,
              tickWidth: 0,
              minorTickInterval: undefined,
              tickAmount: 2,
              labels: { enabled: false },
              pane: 1,
            },
            {
              min: 0,
              max: backlogMax,
              stops: [
                [0.0, "#10b981"],
                [0.6, "#f59e0b"],
                [1.0, "#ef4444"],
              ],
              lineWidth: 0,
              tickWidth: 0,
              minorTickInterval: undefined,
              tickAmount: 2,
              labels: { enabled: false },
              pane: 2,
            },
          ],
          plotOptions: {
            solidgauge: {
              linecap: "round",
              stickyTracking: false,
              rounded: true,
              dataLabels: {
                y: -12,
                borderWidth: 0,
                useHTML: true,
                style: {
                  textOutline: "none",
                },
              },
            },
            series: {
              animation: {
                duration: 600,
              },
            },
          },
          legend: {
            enabled: false,
          },
          credits: {
            enabled: false,
          },
          series: [
            {
              type: "solidgauge",
              name: "% cierre",
              yAxis: 0,
              data: [
                {
                  y: closurePercentage,
                  color: "#10b981",
                  dataLabels: {
                    format:
                      '<div style="text-align:center"><span style="font-size:1.6rem;color:' +
                      chartTextColor +
                      '">{y:.1f}%</span><br/><span style="font-size:0.8rem;color:' +
                      chartSubtleTextColor +
                      '">% cierre</span></div>',
                  },
                },
              ],
            },
            {
              type: "solidgauge",
              name: "Tiempo promedio",
              yAxis: 1,
              data: [
                {
                  y: avgResolutionDays,
                  color: "#f59e0b",
                  dataLabels: {
                    format:
                      '<div style="text-align:center"><span style="font-size:1.6rem;color:' +
                      chartTextColor +
                      '">{y:.1f}</span><br/><span style="font-size:0.8rem;color:' +
                      chartSubtleTextColor +
                      '">dias promedio</span></div>',
                  },
                },
              ],
            },
            {
              type: "solidgauge",
              name: "Backlog activo",
              yAxis: 2,
              data: [
                {
                  y: backlogActive,
                  color: "#ef4444",
                  dataLabels: {
                    format:
                      '<div style="text-align:center"><span style="font-size:1.6rem;color:' +
                      chartTextColor +
                      '">{y:.0f}</span><br/><span style="font-size:0.8rem;color:' +
                      chartSubtleTextColor +
                      '">backlog activo</span></div>',
                  },
                },
              ],
            },
          ],
        } as Highcharts.Options
      }
    />
  );
};

export default SolidGaugeMultiKpiChart;
