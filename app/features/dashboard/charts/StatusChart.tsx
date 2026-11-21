import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { optionsChartDefault } from "@shared/libs";
import { EVIDENCE_STATUS_COLOR } from "@shared/constants/semanticTones";
import {
  hasCompleteFilters as isComplete,
  useDashboardSummary,
} from "../_components/useDashboardSummary";
import { centerTotalLabel } from "./centerTotalLabel";
import { donutResponsive } from "./donutResponsive";

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
    states: string[];
    mainTypeNames: string[];
  };
}

const statusOrder = ["Abierto", "En progreso", "Cerrado", "Cancelado"];

const StatusChart = ({ filters }: Props) => {
  const theme = useTheme();
  // La misma consulta que usa la página para su estado (una sola petición).
  const statusData = useDashboardSummary(filters).data ?? null;

  const hasCompleteFilters = isComplete(filters);

  const seriesData = useMemo(() => {
    const dataMap = new Map((statusData?.seriesData || []).map((item) => [item.name, item.y]));

    return statusOrder.map((name) => ({
      name,
      // Cada estatus con su color del sistema.
      color: EVIDENCE_STATUS_COLOR[name]?.main,
      y: dataMap.get(name) || 0,
    }));
  }, [statusData]);

  const chartSeriesData = useMemo(() => seriesData.filter((item) => item.y > 0), [seriesData]);

  const total = statusData?.total || 0;
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
            type: "pie",
            backgroundColor: "transparent",
            plotBackgroundColor: "transparent",
            events: { render: centerTotalLabel(total, chartTextColor) },
          },
          accessibility: {
            point: {
              valueSuffix: "%",
            },
          },
          title: {
            text: (() => {
              const titleParts = ["Hallazgos por estatus"];

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
            pointFormat: "{series.name}: <b>{point.y}</b> hallazgos ({point.percentage:.0f}%)",
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
              allowPointSelect: true,
              cursor: "pointer",
              borderRadius: 8,
              dataLabels: [
                {
                  enabled: true,
                  distance: 20,
                  allowOverlap: true,
                  format: "{point.name}: {point.percentage:.0f}% ({point.y})",
                  style: {
                    fontSize: "0.9em",
                    color: chartTextColor,
                    textOutline: "none",
                  },
                },
              ],
              showInLegend: true,
            },
          },
          responsive: donutResponsive,
          series: [
            {
              name: "Estatus",
              colorByPoint: true,
              innerSize: "75%",
              data: chartSeriesData,
            },
          ],
        } as Highcharts.Options
      }
    />
  );
};

export default StatusChart;
