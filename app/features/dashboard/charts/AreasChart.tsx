import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { useDashboardChart } from "../_components/useDashboardSummary";
import { optionsChartDefault } from "@shared/libs";
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

const AreasChart = ({ filters }: Props) => {
  const theme = useTheme();
  const { data: areasData = null } = useDashboardChart("areas", filters);

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  const seriesData = useMemo(() => {
    return areasData?.seriesData || [];
  }, [areasData]);

  const chartSeriesData = useMemo(() => seriesData.filter((item) => item.y > 0), [seriesData]);

  const total = areasData?.total || 0;
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
              const titleParts = ["Hallazgos por Zona"];

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
              name: "Áreas",
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

export default AreasChart;
