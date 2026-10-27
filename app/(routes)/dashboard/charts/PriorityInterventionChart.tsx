"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Paper } from "@mui/material";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { ResponseDashboardPriorityInterventionByFilters } from "@interfaces";
import { DashboardService } from "@services";
import { optionsChartDefault } from "@shared/libs";
import { priorityOptions } from "@routes/hallazgos/_constants/priorityOptions";

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

const priorityOrder = priorityOptions.map((option) => option.name);

const PriorityInterventionChart = ({ filters }: Props) => {
  const theme = useTheme();
  const [priorityData, setPriorityData] =
    useState<ResponseDashboardPriorityInterventionByFilters | null>(null);

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  useEffect(() => {
    if (!hasCompleteFilters) {
      setPriorityData(null);
      return;
    }

    DashboardService.findPriorityInterventionByFilters({
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
    }).then(setPriorityData);
  }, [
    hasCompleteFilters,
    filters.areaIds,
    filters.responsibleIds,
    filters.mainTypeIds,
    filters.manufacturingPlantId,
    filters.startDate,
    filters.endDate,
  ]);

  const orderedSeriesData = useMemo(() => {
    const dataMap = new Map(
      (priorityData?.seriesData || []).map((item) => [item.name, item]),
    );

    return priorityOrder.map((name) => {
      const item = dataMap.get(name);
      return {
        name,
        days: item?.days || 0,
        y: item?.y || 0,
        color: item?.color || "#94a3b8",
      };
    });
  }, [priorityData]);

  const categories = orderedSeriesData.map(
    (item) => `${item.name} (${item.days} d\u00edas)`,
  );

  const seriesData = orderedSeriesData.map((item) => ({
    y: item.y,
    color: item.color,
  }));

  const totalWithPriority =
    priorityData?.totalWithPriority ?? priorityData?.total ?? 0;
  const totalWithoutPriority = priorityData?.totalWithoutPriority || 0;
  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  if (hasCompleteFilters && priorityData && totalWithPriority === 0) {
    return null;
  }

  return (
    <Paper sx={{ minHeight: 420, p: 2 }}>
      <Chart
        highcharts={Highcharts}
        containerProps={{ style: { height: "100%" } }}
        options={
          {
            ...optionsChartDefault,
            chart: {
              type: "bar",
              backgroundColor: "transparent",
              plotBackgroundColor: "transparent",
            },
            title: {
              text: (() => {
                const titleParts = ["Prioridad de intervenci\u00f3n"];

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
                ? `Planta: <b>${filters.manufacturingPlantName || "-"}</b> - Fecha inicio: <b>${filters.startDate}</b> - Fecha fin: <b>${filters.endDate}</b> - Total con prioridad: <b>${totalWithPriority.toLocaleString("es-MX")}</b> - Sin prioridad: <b>${totalWithoutPriority.toLocaleString("es-MX")}</b>`
                : "Seleccione planta, fecha inicio y fecha fin",
              style: {
                color: chartSubtleTextColor,
              },
            },
            xAxis: {
              categories,
              title: {
                text: null,
              },
              labels: {
                style: {
                  color: chartTextColor,
                },
              },
            },
            yAxis: {
              min: 0,
              title: {
                text: "Hallazgos",
                style: {
                  color: chartTextColor,
                },
              },
              allowDecimals: false,
              labels: {
                style: {
                  color: chartTextColor,
                },
              },
              gridLineColor: chartBorderColor,
            },
            legend: {
              enabled: false,
            },
            tooltip: {
              pointFormat: "<b>{point.y}</b> hallazgos",
              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
              borderColor: chartBorderColor,
              style: {
                color: chartTextColor,
              },
            },
            plotOptions: {
              series: {
                borderRadius: 6,
                dataLabels: {
                  enabled: true,
                  format: "{point.y}",
                  style: {
                    color: chartTextColor,
                    textOutline: "none",
                  },
                },
              },
            },
            series: [
              {
                type: "bar",
                name: "Hallazgos",
                data: seriesData,
              },
            ],
          } as Highcharts.Options
        }
      />
    </Paper>
  );
};

export default PriorityInterventionChart;
