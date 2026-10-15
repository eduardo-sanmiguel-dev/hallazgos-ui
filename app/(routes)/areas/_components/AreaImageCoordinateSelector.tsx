"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { Box, Button, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

export type AreaMarkedPoint = {
  x: number;
  y: number;
  zoom: number;
};

type SelectedPoint = AreaMarkedPoint & {
  percentX: number;
  percentY: number;
};

type AreaImageCoordinateSelectorProps = {
  imageSrc: string;
  initialPoint?: AreaMarkedPoint | null;
  onPointChange?: (point: AreaMarkedPoint | null) => void;
  mode?: "selector" | "heatmap";
  heatmapHeaderTitle?: string;
  heatmapData?: {
    startDate: string;
    endDate: string;
    totalAreas: number;
    totalEvidences: number;
    totalOpenEvidences: number;
    totalOpenEvidencesWithCoordinates: number;
    maxX: number;
    maxY: number;
    maxValue: number;
    points: {
      areaId: number;
      areaName: string;
      x: number;
      y: number;
      zoomLevel: number | null;
      value: number;
      dominantStatus: string;
      statusCounts: {
        Abierto: number;
        "En progreso": number;
        Cerrado: number;
        Cancelado: number;
      };
    }[];
  } | null;
  loading?: boolean;
};

type ZoomViewportProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  children: ReactNode;
};

const ZoomViewport = ({ onZoomIn, onZoomOut, children }: ZoomViewportProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelAccumulatorRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      wheelAccumulatorRef.current += event.deltaY;

      const threshold = 100;
      if (Math.abs(wheelAccumulatorRef.current) < threshold) {
        return;
      }

      if (wheelAccumulatorRef.current > 0) {
        onZoomOut();
      } else {
        onZoomIn();
      }

      wheelAccumulatorRef.current = 0;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [onZoomIn, onZoomOut]);

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        minHeight: 0,
        height: "100%",
        width: "100%",
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: "hidden",
        overscrollBehavior: "none",
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      {children}
    </Box>
  );
};

const sharedPaperSx = {
  width: "100%",
  flex: 1,
  minHeight: { xs: 320, md: 420 },
  height: { xs: "56vh", md: "68vh" },
  maxHeight: "calc(100vh - 210px)",
  p: 2,
  display: "flex",
  flexDirection: "column",
  gap: 1,
  overflow: "hidden",
} as const;

const AreaImageCoordinateSelector = ({
  imageSrc,
  initialPoint = null,
  onPointChange,
  mode = "selector",
  heatmapHeaderTitle = "",
  heatmapData = null,
  loading = false,
}: AreaImageCoordinateSelectorProps) => {
  const [currentScale, setCurrentScale] = useState(1);
  const [heatmapScale, setHeatmapScale] = useState(1);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  );

  // Si la imagen ya estaba cargada (caché o carga antes de la hidratación),
  // onLoad no se dispara: se toma el tamaño real al montar el <img>. Sin esto
  // las coordenadas se calculaban en píxeles de pantalla y el punto guardado
  // no se mostraba al editar.
  const syncNaturalSize = (img: HTMLImageElement | null) => {
    if (!img?.complete || !img.naturalWidth || !img.naturalHeight) return;

    setImageNaturalSize((prev) =>
      prev.width === img.naturalWidth && prev.height === img.naturalHeight
        ? prev
        : { width: img.naturalWidth, height: img.naturalHeight },
    );
  };

  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!initialPoint) {
      setSelectedPoint(null);
      return;
    }

    if (!imageNaturalSize.width || !imageNaturalSize.height) {
      return;
    }

    setSelectedPoint({
      ...initialPoint,
      percentX: (initialPoint.x / imageNaturalSize.width) * 100,
      percentY: (initialPoint.y / imageNaturalSize.height) * 100,
    });
  }, [imageNaturalSize.height, imageNaturalSize.width, initialPoint]);

  const selectPointFromPointer = (
    target: HTMLDivElement,
    clientX: number,
    clientY: number,
  ) => {
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const percentX = (offsetX / rect.width) * 100;
    const percentY = (offsetY / rect.height) * 100;

    const x = imageNaturalSize.width
      ? Math.round((offsetX / rect.width) * imageNaturalSize.width)
      : Math.round(offsetX);
    const y = imageNaturalSize.height
      ? Math.round((offsetY / rect.height) * imageNaturalSize.height)
      : Math.round(offsetY);

    const point: SelectedPoint = {
      x,
      y,
      percentX,
      percentY,
      zoom: currentScale,
    };

    setSelectedPoint(point);
    onPointChange?.({ x: point.x, y: point.y, zoom: point.zoom });
  };

  const handleImagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    isDraggingRef.current = false;
  };

  const handleImagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) {
      return;
    }

    const deltaX = Math.abs(event.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(event.clientY - pointerStartRef.current.y);
    if (deltaX > 6 || deltaY > 6) {
      isDraggingRef.current = true;
    }
  };

  const handleImagePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) {
      return;
    }

    if (!isDraggingRef.current) {
      selectPointFromPointer(event.currentTarget, event.clientX, event.clientY);
    }

    pointerStartRef.current = null;
    isDraggingRef.current = false;
  };

  const handleImagePointerCancel = () => {
    pointerStartRef.current = null;
    isDraggingRef.current = false;
  };

  if (mode === "heatmap") {
    const openPoints = (heatmapData?.points || []).filter(
      (point) => point.statusCounts.Abierto > 0,
    );
    const heatToneByKey: Record<string, "red" | "yellow" | "green"> = {};
    const pointKey = (point: { areaId: number; x: number; y: number }) =>
      `${point.areaId}-${point.x}-${point.y}`;

    const openValues = openPoints.map((point) => point.statusCounts.Abierto);
    const minOpenValue = openValues.length > 0 ? Math.min(...openValues) : 0;
    const maxOpenValue = openValues.length > 0 ? Math.max(...openValues) : 1;
    const dynamicRange = Math.max(maxOpenValue - minOpenValue, 1);

    const pointsByRelativeIntensity = [...openPoints]
      .map((point) => ({
        point,
        relativeIntensity:
          (point.statusCounts.Abierto - minOpenValue) / dynamicRange,
      }))
      .sort((a, b) => b.relativeIntensity - a.relativeIntensity);

    if (pointsByRelativeIntensity.length === 1) {
      heatToneByKey[pointKey(pointsByRelativeIntensity[0].point)] = "red";
    } else if (pointsByRelativeIntensity.length === 2) {
      heatToneByKey[pointKey(pointsByRelativeIntensity[0].point)] = "red";
      heatToneByKey[pointKey(pointsByRelativeIntensity[1].point)] = "yellow";
    } else if (pointsByRelativeIntensity.length >= 3) {
      const total = pointsByRelativeIntensity.length;
      const redLimit = Math.max(1, Math.ceil(total / 3));
      const yellowLimit = Math.max(redLimit + 1, Math.ceil((2 * total) / 3));

      pointsByRelativeIntensity.forEach(({ point }, index) => {
        if (index < redLimit) {
          heatToneByKey[pointKey(point)] = "red";
          return;
        }

        if (index < yellowLimit) {
          heatToneByKey[pointKey(point)] = "yellow";
          return;
        }

        heatToneByKey[pointKey(point)] = "green";
      });
    }

    const totalOpenFindings = openPoints.reduce(
      (sum, point) => sum + point.statusCounts.Abierto,
      0,
    );
    const maxValue = Math.max(
      ...openPoints.map((point) => point.statusCounts.Abierto),
      1,
    );
    const canProjectPoints =
      imageNaturalSize.width > 0 && imageNaturalSize.height > 0;
    const heatmapInitialZoom = 1;

    const normalizedPoints = openPoints.map((point) => {
      const zoomLevel =
        point.zoomLevel && point.zoomLevel > 0 ? point.zoomLevel : 1;

      // In selector mode, x/y are stored in natural image space (not scaled by zoom).
      // Keep that mapping as source of truth and only fallback for potential legacy data.
      let projectedX = point.x;
      let projectedY = point.y;

      if (
        canProjectPoints &&
        (projectedX > imageNaturalSize.width ||
          projectedY > imageNaturalSize.height)
      ) {
        const legacyScale = zoomLevel / heatmapInitialZoom;
        if (legacyScale > 0) {
          projectedX = projectedX / legacyScale;
          projectedY = projectedY / legacyScale;
        }
      }

      const normalizedIntensity = Math.max(
        point.statusCounts.Abierto / maxValue,
        0.08,
      );
      const diameter = 28 + normalizedIntensity * 96;
      const zoomAwareDiameter = Math.max(
        14,
        Math.min(220, diameter / Math.max(heatmapScale, 0.0001)),
      );

      const toneTier = heatToneByKey[pointKey(point)] || "red";

      const heatTone =
        toneTier === "red"
          ? {
              core: "rgba(220, 38, 38, 0.62)",
              mid: "rgba(248, 113, 113, 0.42)",
              edge: "rgba(254, 202, 202, 0.18)",
              glow: "rgba(220, 38, 38, 0.6)",
              badgeBg: "rgba(239, 68, 68, 0.2)",
              badgeBorder: "rgba(239, 68, 68, 0.45)",
              badgeText: "#fecaca",
            }
          : toneTier === "yellow"
            ? {
                core: "rgba(245, 158, 11, 0.62)",
                mid: "rgba(251, 191, 36, 0.42)",
                edge: "rgba(254, 240, 138, 0.18)",
                glow: "rgba(245, 158, 11, 0.58)",
                badgeBg: "rgba(251, 191, 36, 0.2)",
                badgeBorder: "rgba(251, 191, 36, 0.45)",
                badgeText: "#fde68a",
              }
            : {
                core: "rgba(22, 163, 74, 0.62)",
                mid: "rgba(74, 222, 128, 0.42)",
                edge: "rgba(187, 247, 208, 0.18)",
                glow: "rgba(22, 163, 74, 0.58)",
                badgeBg: "rgba(34, 197, 94, 0.2)",
                badgeBorder: "rgba(34, 197, 94, 0.45)",
                badgeText: "#bbf7d0",
              };

      return {
        ...point,
        xAdjusted: projectedX,
        yAdjusted: projectedY,
        xNorm: canProjectPoints
          ? Math.min(
              100,
              Math.max(0, (projectedX / imageNaturalSize.width) * 100),
            )
          : 0,
        yNorm: canProjectPoints
          ? Math.min(
              100,
              Math.max(0, (projectedY / imageNaturalSize.height) * 100),
            )
          : 0,
        openCount: point.statusCounts.Abierto,
        diameter: zoomAwareDiameter,
        heatTone,
      };
    });

    const legendRed = "#ef4444";
    const legendYellow = "#fbbf24";
    const legendGreen = "#22c55e";

    const legendScale =
      openPoints.length <= 1
        ? {
            segments: [legendRed],
            ticks: [
              {
                label: String(maxOpenValue),
                align: "center" as const,
              },
            ],
          }
        : openPoints.length === 2
          ? {
              segments: [legendYellow, legendRed],
              ticks: [
                {
                  label: String(minOpenValue),
                  align: "left" as const,
                },
                {
                  label: String(maxOpenValue),
                  align: "right" as const,
                },
              ],
            }
          : {
              segments: [legendGreen, legendYellow, legendRed],
              ticks: [
                {
                  label: String(minOpenValue),
                  align: "left" as const,
                },
                {
                  label: String(Math.round(minOpenValue + dynamicRange / 2)),
                  align: "center" as const,
                },
                {
                  label: String(maxOpenValue),
                  align: "right" as const,
                },
              ],
            };

    const totalOpenGlobal =
      heatmapData?.totalOpenEvidences ?? totalOpenFindings;

    return (
      <Paper sx={sharedPaperSx}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{
            p: 1,
            alignItems: { xs: "flex-start", md: "stretch" },
            borderRadius: 1.5,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: "rgba(2, 6, 23, 0.04)",
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "33%" } }}>
            <Typography variant="caption" color="text.secondary">
              Vista
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              Mapa de calor por coordenadas
            </Typography>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", md: "34%" },
              textAlign: { xs: "left", md: "center" },
              px: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Filtros aplicados
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.primary",
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              {heatmapHeaderTitle || "Filtros: sin selección"}
            </Typography>
          </Box>

          <Box sx={{ width: { xs: "100%", md: "33%" } }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography variant="caption" color="text.secondary">
                  Zonas
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                  {openPoints.length}
                </Typography>
              </Box>

              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography variant="caption" color="text.secondary">
                  Georreferenciados
                </Typography>
                <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
                  {`${totalOpenFindings} / ${totalOpenGlobal}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 0.5,
            mx: "auto",
            width: "100%",
            maxWidth: { xs: 260, sm: 320, md: 360 },
            px: 0.75,
            py: 0.5,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: "rgba(15, 23, 42, 0.04)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontWeight: 600,
              color: "text.secondary",
              mb: 0.35,
              textAlign: "center",
              fontSize: "0.68rem",
            }}
          >
            Escala de colores
          </Typography>

          <Box
            sx={{
              height: 8,
              width: "100%",
              borderRadius: 99,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: `repeat(${legendScale.segments.length}, minmax(0, 1fr))`,
              border: "1px solid rgba(148, 163, 184, 0.35)",
            }}
          >
            {legendScale.segments.map((color, index) => (
              <Box
                key={`${color}-${index}`}
                sx={{
                  bgcolor: color,
                }}
              />
            ))}
          </Box>

          <Stack direction="row" sx={{ mt: 0.2 }}>
            {legendScale.ticks.map((tick, index) => (
              <Box
                key={`${tick.label}-${index}`}
                sx={{
                  flex: 1,
                  textAlign: tick.align,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.66rem", lineHeight: 1 }}
                >
                  {tick.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Cargando mapa de calor...
          </Typography>
        ) : openPoints.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay hallazgos abiertos con coordenadas para los filtros
            seleccionados.
          </Typography>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={30}
            wheel={{ disabled: true }}
            centerOnInit
            pinch={{ step: 5 }}
            panning={{ disabled: false, velocityDisabled: true }}
            doubleClick={{ disabled: true }}
            onTransform={(ref) => {
              setHeatmapScale(ref.state.scale);
            }}
          >
            {({ zoomIn, zoomOut }) => (
              <ZoomViewport onZoomIn={zoomIn} onZoomOut={zoomOut}>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      height: "100%",
                      aspectRatio:
                        imageNaturalSize.width && imageNaturalSize.height
                          ? `${imageNaturalSize.width} / ${imageNaturalSize.height}`
                          : "16 / 9",
                      overflow: "hidden",
                      bgcolor: "#0d1117",
                    }}
                  >
                    <Box
                      component="img"
                      ref={syncNaturalSize}
                      src={imageSrc}
                      alt="Plano para mapa de calor"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      draggable={false}
                      onLoad={(
                        event: React.SyntheticEvent<HTMLImageElement>,
                      ) => {
                        const target = event.currentTarget;
                        setImageNaturalSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                        filter: "brightness(0.95)",
                        zIndex: 1,
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                    />

                    {!canProjectPoints && (
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 3,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "flex-start",
                          p: 1,
                          pointerEvents: "none",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Cargando plano para proyectar coordenadas...
                        </Typography>
                      </Box>
                    )}

                    {canProjectPoints &&
                      normalizedPoints.map((point) => (
                        <Tooltip
                          key={`${point.areaId}-${point.x}-${point.y}`}
                          arrow
                          placement="top"
                          enterDelay={80}
                          leaveDelay={120}
                          slotProps={{
                            tooltip: {
                              sx: {
                                "@keyframes heatmapTooltipIn": {
                                  from: {
                                    opacity: 0,
                                    transform: "translateY(10px) scale(0.98)",
                                  },
                                  to: {
                                    opacity: 1,
                                    transform: "translateY(0) scale(1)",
                                  },
                                },
                                px: 1.5,
                                py: 1.25,
                                minWidth: 260,
                                maxWidth: 340,
                                borderRadius: 1.5,
                                border: "1px solid rgba(255,255,255,0.28)",
                                background:
                                  "linear-gradient(135deg, rgba(7, 12, 23, 0.96) 0%, rgba(18, 27, 45, 0.96) 100%)",
                                backdropFilter: "blur(6px)",
                                boxShadow:
                                  "0 14px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05) inset",
                                animation:
                                  "heatmapTooltipIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                              },
                            },
                            arrow: {
                              sx: {
                                color: "rgba(18, 27, 45, 0.96)",
                              },
                            },
                          }}
                          title={
                            <Stack spacing={0.75}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  letterSpacing: 0.3,
                                  color: "#f8fafc",
                                  lineHeight: 1.2,
                                }}
                              >
                                {point.areaName}
                              </Typography>
                              <Box
                                sx={{
                                  height: 1,
                                  width: "100%",
                                  bgcolor: "rgba(148, 163, 184, 0.32)",
                                }}
                              />
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ alignItems: "center" }}
                              >
                                <Box
                                  sx={{
                                    px: 1,
                                    py: 0.35,
                                    borderRadius: 99,
                                    bgcolor: point.heatTone.badgeBg,
                                    border: `1px solid ${point.heatTone.badgeBorder}`,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: point.heatTone.badgeText,
                                      fontWeight: 700,
                                      letterSpacing: 0.2,
                                    }}
                                  >
                                    ABIERTOS
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: "#ffffff",
                                    fontWeight: 800,
                                    lineHeight: 1,
                                  }}
                                >
                                  {point.openCount}
                                </Typography>
                              </Stack>
                            </Stack>
                          }
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              left: `${point.xNorm}%`,
                              top: `${point.yNorm}%`,
                              width: point.diameter,
                              height: point.diameter,
                              transform: "translate(-50%, -50%)",
                              borderRadius: "50%",
                              pointerEvents: "auto",
                              zIndex: 2,
                              background: `radial-gradient(circle, ${point.heatTone.core} 0%, ${point.heatTone.mid} 38%, ${point.heatTone.edge} 62%, rgba(255, 255, 255, 0) 100%)`,
                              boxShadow: `0 0 24px ${point.heatTone.glow}`,
                            }}
                          />
                        </Tooltip>
                      ))}
                  </Box>
                </TransformComponent>
              </ZoomViewport>
            )}
          </TransformWrapper>
        )}
      </Paper>
    );
  }

  return (
    <Paper sx={sharedPaperSx}>
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={30}
        wheel={{ disabled: true }}
        centerOnInit
        pinch={{ step: 5 }}
        panning={{ disabled: false, velocityDisabled: true }}
        doubleClick={{ disabled: true }}
        onTransform={(ref) => {
          setCurrentScale(ref.state.scale);
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => {
          const markerScale = 1 / Math.max(currentScale, 0.0001);

          return (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                sx={{
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => zoomIn()}
                  >
                    Acercar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RemoveIcon />}
                    onClick={() => zoomOut()}
                  >
                    Alejar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RestartAltIcon />}
                    onClick={() => resetTransform()}
                  >
                    Reset
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Rueda del mouse: zoom | arrastra con cursor para moverte
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPoint
                    ? `Punto seleccionado: X ${selectedPoint.x}, Y ${selectedPoint.y}, Zoom ${selectedPoint.zoom.toFixed(2)}x`
                    : "Haz click sobre la imagen para marcar un punto"}
                </Typography>
              </Stack>

              <ZoomViewport onZoomIn={zoomIn} onZoomOut={zoomOut}>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    onPointerDown={handleImagePointerDown}
                    onPointerMove={handleImagePointerMove}
                    onPointerUp={handleImagePointerUp}
                    onPointerCancel={handleImagePointerCancel}
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "100%",
                      maxHeight: "100%",
                      aspectRatio:
                        imageNaturalSize.width && imageNaturalSize.height
                          ? `${imageNaturalSize.width} / ${imageNaturalSize.height}`
                          : "16 / 9",
                      userSelect: "none",
                      cursor: "crosshair",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      ref={syncNaturalSize}
                      src={imageSrc}
                      alt="Planos"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      draggable={false}
                      onLoad={(
                        event: React.SyntheticEvent<HTMLImageElement>,
                      ) => {
                        const target = event.currentTarget;
                        setImageNaturalSize({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }}
                      sx={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />

                    {selectedPoint && (
                      <Box
                        sx={{
                          position: "absolute",
                          left: `${selectedPoint.percentX}%`,
                          top: `${selectedPoint.percentY}%`,
                          transform: "translate(-50%, -50%)",
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      >
                        <Box
                          sx={{
                            transform: `scale(${markerScale})`,
                            transformOrigin: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              border: "3px solid #ffffff",
                              backgroundColor: "#ff1744",
                              boxShadow: "0 0 0 4px rgba(255, 23, 68, 0.35)",
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </TransformComponent>
              </ZoomViewport>
            </>
          );
        }}
      </TransformWrapper>
    </Paper>
  );
};

export default AreaImageCoordinateSelector;
