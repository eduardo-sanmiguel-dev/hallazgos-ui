"use client";

import { ReactNode, useId, useState } from "react";

import Highcharts from "highcharts/esm/highcharts.src.js";
import { Chart } from "@highcharts/react";

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";

import EmptyState from "@shared/components/EmptyState";

export interface ChartTable {
  columns: { label: string; numeric?: boolean }[];
  rows: ReactNode[][];
}

interface Props {
  title: string;
  description?: ReactNode;
  options: Highcharts.Options;
  table: ChartTable;
  isEmpty?: boolean;
  emptyText?: string;
  height?: number;
}

// Opciones comunes: el título vive en el encabezado HTML de la tarjeta,
// rejilla recesiva y leyenda arriba a la izquierda.
// Mismo formato numérico que los KPIs (es-MX), sin depender del navegador.
const baseOptions = (height: number): Highcharts.Options => ({
  lang: { locale: "es-MX" },
  title: { text: undefined },
  subtitle: { text: undefined },
  credits: { enabled: false },
  chart: { height, spacing: [8, 20, 8, 4], style: { fontFamily: "inherit" } },
  legend: {
    align: "left",
    verticalAlign: "top",
    itemStyle: { fontWeight: "500", fontSize: "12px" },
  },
  xAxis: { lineWidth: 1, tickLength: 0 },
  yAxis: {
    gridLineWidth: 1,
    title: { text: undefined },
    // Evita que la última etiqueta se recorte con "…".
    labels: { style: { textOverflow: "none", whiteSpace: "nowrap" } },
  },
  tooltip: { outside: true, borderRadius: 6 },
  // Los datos se consultan desde la vista de tabla de la tarjeta.
  exporting: { enabled: false },
  plotOptions: {
    series: { animation: { duration: 300 } },
    column: {
      borderWidth: 0,
      borderRadius: 4,
      pointPadding: 0.06,
      groupPadding: 0.14,
    },
    bar: {
      borderWidth: 0,
      borderRadius: 4,
      pointPadding: 0.06,
      groupPadding: 0.14,
    },
  },
});

export default function ChartCard({
  title,
  description,
  options,
  table,
  isEmpty = false,
  emptyText = "Sin datos para la planta y el periodo seleccionados.",
  height = 320,
}: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const titleId = useId();

  const merged = Highcharts.merge(baseOptions(height), options);

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: { xs: 1.5, sm: 2 }, height: "100%", minWidth: 0 }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            id={titleId}
            variant="subtitle1"
            component="h3"
            sx={{ fontWeight: 600, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {!isEmpty && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, next) => next && setView(next)}
            aria-label={`Vista de ${title}`}
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="chart" aria-label="Ver gráfica">
              <BarChartIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Ver tabla">
              <TableRowsOutlinedIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {isEmpty ? (
        <Box sx={{ minHeight: height, display: "grid", placeItems: "center" }}>
          <EmptyState title="Sin datos" description={emptyText} size="small" />
        </Box>
      ) : view === "chart" ? (
        <Chart highcharts={Highcharts} options={merged} />
      ) : (
        <TableContainer sx={{ maxHeight: height, overflow: "auto" }}>
          <Table size="small" stickyHeader aria-label={title}>
            <TableHead>
              <TableRow>
                {table.columns.map(({ label, numeric }) => (
                  <TableCell
                    key={label}
                    align={numeric ? "right" : "left"}
                    sx={{ fontWeight: 600, whiteSpace: "nowrap" }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} hover>
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      align={
                        table.columns[cellIndex]?.numeric ? "right" : "left"
                      }
                      sx={
                        table.columns[cellIndex]?.numeric
                          ? { fontVariantNumeric: "tabular-nums" }
                          : undefined
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
