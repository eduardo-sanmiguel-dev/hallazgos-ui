"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Paper } from "@mui/material";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { ResponseDashboardRiskLevelByFilters } from "@interfaces";
import { DashboardService } from "@services";
import { optionsChartDefault } from "@shared/libs";
import { RISK_LEVEL_ORDER } from "@routes/hallazgos/_constants/priorityOptions";

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

const riskOrder = RISK_LEVEL_ORDER;

const RiskLevelChart = ({ filters }: Props) => {
  const theme = useTheme();
  const [riskData, setRiskData] =
    useState<ResponseDashboardRiskLevelByFilters | null>(null);

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  useEffect(() => {
    if (!hasCompleteFilters) {
      setRiskData(null);
      return;
    }

    DashboardService.findRiskLevelByFilters({
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
    }).then(setRiskData);
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
      (riskData?.seriesData || []).map((item) => [item.name, item]),
    );

    return riskOrder.map((name) => {
      const item = dataMap.get(name);
      return {
        name,
        y: item?.y || 0,
        color: item?.color || "#94a3b8",
      };
    });
  }, [riskData]);

  const categories = orderedSeriesData.map((item) => item.name);
  const seriesData = orderedSeriesData.map((item) => ({
    y: item.y,
    color: item.color,
  }));

  const totalWithPriority = riskData?.totalWithPriority ?? riskData?.total ?? 0;
  const totalWithoutPriority = riskData?.totalWithoutPriority || 0;
  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  if (hasCompleteFilters && riskData && totalWithPriority === 0) {
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
                const titleParts = ["Nivel de riesgo"];

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
                ? `Planta: <b>${filters.manufacturingPlantName || "-"}</b> - Fecha inicio: <b>${filters.startDate}</b> - Fecha fin: <b>${filters.endDate}</b> - Total clasificado: <b>${totalWithPriority.toLocaleString("es-MX")}</b> - Sin prioridad: <b>${totalWithoutPriority.toLocaleString("es-MX")}</b>`
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

export default RiskLevelChart;
