"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, IconButton, Slider, Typography } from "@mui/material";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import "highcharts/esm/modules/accessibility.src.js";

import { DashboardService } from "@services";
import { optionsChartDefault } from "@shared/libs";

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "short",
  year: "numeric",
});

const ANIMATION_DURATION = 1000;

const HistoricalChart = () => {
  const theme = useTheme();
  const { data: historicalData = null } = useQuery({
    queryKey: ["dashboard", "historical-by-month"],
    queryFn: () => DashboardService.findHistoricalByMonth(),
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
  }, [historicalData?.categories?.length]);

  const isDarkMode = theme.palette.mode === "dark";
  const chartTextColor = isDarkMode ? "#f1f5f9" : "#111827";
  const chartSubtleTextColor = isDarkMode ? "#cbd5e1" : "#374151";
  const chartBorderColor = isDarkMode ? "#334155" : "#d1d5db";

  const categories = useMemo(
    () =>
      (historicalData?.categories || []).map((monthKey) => {
        const [year, month] = monthKey.split("-");
        const parsed = new Date(Number(year), Number(month) - 1, 1);
        return monthFormatter.format(parsed);
      }),
    [historicalData],
  );

  const series = useMemo(
    () =>
      (historicalData?.series || []).map((item) => ({
        ...item,
        data: item.data.map((value, pointIndex) =>
          pointIndex <= currentIndex ? value : null,
        ),
        type: "line" as const,
      })),
    [historicalData, currentIndex],
  );

  const maxIndex = Math.max(categories.length - 1, 0);

  useEffect(() => {
    if (!isPlaying || maxIndex === 0) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ANIMATION_DURATION);

    return () => window.clearInterval(timer);
  }, [isPlaying, maxIndex]);

  const currentMonthLabel = categories[currentIndex] || "";

  const handleTogglePlay = () => {
    if (currentIndex >= maxIndex && maxIndex > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => !prev);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          maxWidth: 620,
          mx: "auto",
          mb: 1,
        }}
      >
        <IconButton
          color="primary"
          onClick={handleTogglePlay}
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <Slider
          min={0}
          max={maxIndex}
          step={1}
          value={Math.min(currentIndex, maxIndex)}
          onChange={(_, value) => {
            setCurrentIndex(Number(value));
            setIsPlaying(false);
          }}
          sx={{ flex: 1 }}
          aria-label="Rango histórico"
        />
      </Box>

      <Typography
        variant="body2"
        sx={{
          textAlign: "left",
          ml: { xs: 1, sm: 9 },
          mb: 0.5,
          color: chartSubtleTextColor,
          fontWeight: 500,
        }}
      >
        {currentMonthLabel
          ? `Mes actual: ${currentMonthLabel}`
          : "Sin datos históricos"}
      </Typography>

      <Typography
        variant="h5"
        sx={{
          textAlign: "left",
          ml: { xs: 1, sm: 9 },
          mb: 1,
          color: chartTextColor,
          fontWeight: 700,
        }}
      >
        Carrera histórica de hallazgos por planta
      </Typography>

      <Chart
        highcharts={Highcharts}
        containerProps={{ style: { height: "480px" } }}
        options={
          {
            ...optionsChartDefault,
            chart: {
              type: "line",
              height: 440,
              backgroundColor: "transparent",
              plotBackgroundColor: "transparent",
              marginRight: 140,
              spacingTop: 95,
              animation: {
                duration: ANIMATION_DURATION,
                easing: (t: number) => t,
              },
            },
            title: {
              text: "",
              floating: true,
              align: "left",
              x: 70,
              y: 18,
              style: {
                color: chartTextColor,
                fontSize: "1.7rem",
                fontWeight: "700",
              },
            },
            subtitle: {
              text: "",
              style: {
                color: chartSubtleTextColor,
              },
            },
            xAxis: {
              categories,
              max: maxIndex,
              title: {
                text: "Mes",
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
            yAxis: {
              min: 0,
              allowDecimals: false,
              title: {
                text: "Hallazgos por mes",
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
            legend: {
              enabled: true,
              align: "center",
              verticalAlign: "bottom",
              layout: "horizontal",
              itemStyle: {
                color: chartTextColor,
              },
              itemHoverStyle: {
                color: chartSubtleTextColor,
              },
            },
            tooltip: {
              shared: true,
              backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
              borderColor: chartBorderColor,
              style: {
                color: chartTextColor,
              },
              valueDecimals: 0,
            },
            plotOptions: {
              series: {
                animation: {
                  duration: ANIMATION_DURATION,
                },
                lineWidth: 3,
                marker: {
                  enabled: true,
                  radius: 3,
                },
                dataLabels: {
                  enabled: false,
                },
              },
            },
            credits: {
              enabled: false,
            },
            series,
          } as Highcharts.Options
        }
      />
    </Box>
  );
};

export default HistoricalChart;
