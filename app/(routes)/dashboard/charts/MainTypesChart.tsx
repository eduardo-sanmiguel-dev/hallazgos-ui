"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { ResponseDashboardStatusByFilters } from "@interfaces";
import { DashboardService } from "@services";
import { optionsChartDefault } from "@shared/libs";
import { donutResponsive } from "./donutResponsive";

type ChartWithCustomLabel = Highcharts.Chart & {
  customLabel?: Highcharts.SVGElement;
};

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

const MainTypesChart = ({ filters }: Props) => {
  const theme = useTheme();
  const [mainTypesData, setMainTypesData] =
    useState<ResponseDashboardStatusByFilters | null>(null);

  const hasCompleteFilters =
    !!filters.manufacturingPlantId && !!filters.startDate && !!filters.endDate;

  useEffect(() => {
    if (!hasCompleteFilters) {
      setMainTypesData(null);
      return;
    }

    DashboardService.findMainTypesByFilters({
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
    }).then(setMainTypesData);
  }, [
    hasCompleteFilters,
    filters.manufacturingPlantId,
    filters.startDate,
    filters.endDate,
    filters.areaIds,
    filters.responsibleIds,
    filters.mainTypeIds,
  ]);

  const seriesData = useMemo(() => {
    return mainTypesData?.seriesData || [];
  }, [mainTypesData]);

  const chartSeriesData = useMemo(
    () => seriesData.filter((item) => item.y > 0),
    [seriesData],
  );

  const total = mainTypesData?.total || 0;
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
            events: {
              render() {
                const chart = this as ChartWithCustomLabel;
                const series = chart.series[0];

                if (!series) return;

                let customLabel = chart.customLabel;
                const centerLabelHtml = `<div style="text-align:center; color:${chartTextColor};"><span style=\"display:block;\">Total</span><strong style=\"display:block;\">${total.toLocaleString("es-MX")}</strong></div>`;

                if (!customLabel) {
                  customLabel = chart.customLabel = chart.renderer
                    .label(
                      centerLabelHtml,
                      0,
                      0,
                      undefined,
                      undefined,
                      undefined,
                      true,
                    )
                    .css({
                      color: chartTextColor,
                      textAnchor: "middle",
                    })
                    .attr({
                      zIndex: 7,
                    })
                    .add();
                }

                customLabel.attr({
                  text: centerLabelHtml,
                });

                customLabel.css({
                  fontSize: `${series.center[2] / 12}px`,
                });

                const labelBBox = customLabel.getBBox();
                const x =
                  series.center[0] + chart.plotLeft - labelBBox.width / 2;
                const y =
                  series.center[1] + chart.plotTop - labelBBox.height / 2;

                customLabel.attr({
                  x,
                  y,
                });
              },
            },
          },
          accessibility: {
            point: {
              valueSuffix: "%",
            },
          },
          title: {
            text: (() => {
              const titleParts = ["Hallazgos por Clasificacion"];

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
            pointFormat:
              "{series.name}: <b>{point.y}</b> hallazgos ({point.percentage:.0f}%)",
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
              name: "Clasificaciones",
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

export default MainTypesChart;
