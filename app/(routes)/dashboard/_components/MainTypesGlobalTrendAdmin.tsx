import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  MainTypesGlobalTrend,
  MainTypesGlobalTrendDetails,
  MainTypesGlobalTrendDetailsZone,
} from "@interfaces";
import { DashboardService } from "@services";
import { resolveTriStateSort } from "@shared/utils";
import {
  Order,
  SortableColumn,
  cardsViewAnimationSx,
  detailsViewAnimationSx,
  formatMetric,
  formatPercentage,
  getTrendColor,
  getTrendIcon,
  parseNumber,
} from "./mainTypesGlobalTrend.helpers";
import { MainTypesResponsiblesTab } from "./MainTypesResponsiblesTab";
import { MainTypesZonesTab } from "./MainTypesZonesTab";

interface Props {
  manufacturingPlantId: string;
}

const MainTypesGlobalTrendAdmin = ({ manufacturingPlantId }: Props) => {
  const [cardsData, setCardsData] = useState<MainTypesGlobalTrend[]>([]);
  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [selectedMainType, setSelectedMainType] = useState<string | null>(null);

  const [detailsData, setDetailsData] = useState<MainTypesGlobalTrendDetails[]>(
    [],
  );
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [zoneData, setZoneData] = useState<MainTypesGlobalTrendDetailsZone[]>(
    [],
  );
  const [isZoneLoading, setIsZoneLoading] = useState(false);
  const [detailTab, setDetailTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<SortableColumn | null>(null);

  useEffect(() => {
    setIsCardsLoading(true);
    setSelectedMainType(null);
    setDetailsData([]);
    setZoneData([]);
    setDetailTab(0);
    setSearchTerm("");
    setOrder("asc");
    setOrderBy(null);
    setPage(0);
    DashboardService.findMainTypesGlobalTrend({
      manufacturingPlantId,
    })
      .then(setCardsData)
      .finally(() => setIsCardsLoading(false));
  }, [manufacturingPlantId]);

  useEffect(() => {
    if (!selectedMainType) return;

    setIsDetailsLoading(true);
    setIsZoneLoading(true);
    DashboardService.findMainTypesGlobalTrendDetails({
      manufacturingPlantId,
      mainTypeId: selectedMainType,
    })
      .then((data) => {
        setDetailsData(data);
        setPage(0);
      })
      .finally(() => setIsDetailsLoading(false));

    DashboardService.findPercentageComplianceByZone({
      manufacturingPlantId,
      mainTypeId: selectedMainType,
    })
      .then((data) => {
        setZoneData(data);
      })
      .finally(() => setIsZoneLoading(false));
  }, [manufacturingPlantId, selectedMainType]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const sortedTrends = useMemo(
    () =>
      [...cardsData].sort(
        (a, b) =>
          parseNumber(b.total_mes_actual) - parseNumber(a.total_mes_actual),
      ),
    [cardsData],
  );

  const totalCurrentMonth = useMemo(
    () =>
      sortedTrends.reduce(
        (acc, item) => acc + parseNumber(item.total_mes_actual),
        0,
      ),
    [sortedTrends],
  );

  const totalPreviousMonth = useMemo(
    () =>
      sortedTrends.reduce(
        (acc, item) => acc + parseNumber(item.total_mes_anterior),
        0,
      ),
    [sortedTrends],
  );

  const weightedResolution = useMemo(() => {
    if (!sortedTrends.length) return 0;
    const totalHistorical = sortedTrends.reduce(
      (acc, item) => acc + parseNumber(item.total_historico),
      0,
    );
    if (!totalHistorical) return 0;
    const weighted = sortedTrends.reduce(
      (acc, item) =>
        acc +
        parseNumber(item.pct_resolucion_historica) *
          parseNumber(item.total_historico),
      0,
    );
    return weighted / totalHistorical;
  }, [sortedTrends]);

  const handleRequestSort = (property: SortableColumn) => {
    const { nextOrder, nextOrderBy } = resolveTriStateSort(
      order,
      orderBy,
      property,
    );

    setOrder(nextOrder);
    setOrderBy(nextOrderBy);
    setPage(0);
  };

  const getSortValue = useCallback(
    (item: MainTypesGlobalTrendDetails, column: SortableColumn) => {
      switch (column) {
        case "responsable":
          return String(item.responsable ?? "").toLowerCase();
        case "max_dias_sin_resolver":
          return item.max_dias_sin_resolver;
        case "responsable_id":
        case "total_asignadas":
        case "abiertas":
        case "cerradas":
        case "canceladas":
        case "pct_resolucion":
        case "promedio_dias_resolucion":
        case "criticos_mas_90_dias":
        case "asignadas_mes_anterior":
        case "asignadas_mes_actual":
        default:
          return parseNumber(item[column]);
      }
    },
    [],
  );

  const filteredDetails = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return detailsData;

    return detailsData.filter((item) =>
      Object.values(item).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [detailsData, searchTerm]);

  const sortedDetails = useMemo(() => {
    if (!orderBy) return filteredDetails;

    return [...filteredDetails]
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const valueA = getSortValue(a.item, orderBy);
        const valueB = getSortValue(b.item, orderBy);

        if (valueA < valueB) return order === "asc" ? -1 : 1;
        if (valueA > valueB) return order === "asc" ? 1 : -1;
        return a.index - b.index;
      })
      .map(({ item }) => item);
  }, [filteredDetails, getSortValue, order, orderBy]);

  const paginatedDetails = sortedDetails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const sortedZoneCards = useMemo(
    () =>
      [...zoneData].sort(
        (a, b) =>
          parseNumber(b.total_hallazgos) - parseNumber(a.total_hallazgos),
      ),
    [zoneData],
  );

  const avgZoneComplianceCurrent = useMemo(() => {
    if (!sortedZoneCards.length) return 0;
    const total = sortedZoneCards.reduce(
      (acc, item) => acc + parseNumber(item.pct_cumplimiento_mes_actual),
      0,
    );
    return total / sortedZoneCards.length;
  }, [sortedZoneCards]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (selectedMainType) {
    return (
      <Paper sx={{ p: 2, ...detailsViewAnimationSx }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="h6">
                {
                  cardsData.find((c) => `${c.id}` === selectedMainType)
                    ?.tipo_principal
                }
              </Typography>
            </Stack>

            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setSelectedMainType(null);
                setDetailTab(0);
                setSearchTerm("");
                setOrder("asc");
                setOrderBy(null);
                setPage(0);
              }}
            >
              Regresar a tarjetas
            </Button>
          </Stack>

          <Tabs
            value={detailTab}
            onChange={(_, value: number) => setDetailTab(value)}
            variant="fullWidth"
            scrollButtons="auto"
            aria-label="Tabs de detalle"
            indicatorColor="secondary"
            textColor="inherit"
            sx={{
              backgroundColor: "primary.main",
              borderRadius: 1,
              "& .MuiTab-root": {
                color: (theme) => alpha(theme.palette.common.white, 0.68),
                opacity: 1,
                transition: "all 0.2s ease",
              },
              "& .MuiTab-root.Mui-selected": {
                color: "common.white",
                fontWeight: 700,
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.14),
              },
            }}
          >
            <Tab label="Cumplimiento por zona" />
            <Tab label="Detalle por responsables" />
          </Tabs>

          <MainTypesZonesTab
            detailTab={detailTab}
            isZoneLoading={isZoneLoading}
            sortedZoneCards={sortedZoneCards}
            avgZoneComplianceCurrent={avgZoneComplianceCurrent}
          />

          <MainTypesResponsiblesTab
            detailTab={detailTab}
            detailsData={detailsData}
            filteredDetails={filteredDetails}
            paginatedDetails={paginatedDetails}
            isDetailsLoading={isDetailsLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            order={order}
            orderBy={orderBy}
            page={page}
            rowsPerPage={rowsPerPage}
            handleRequestSort={handleRequestSort}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, ...cardsViewAnimationSx }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="h6">
            Tendencia global por tipo principal
          </Typography>
          {sortedTrends.length > 0 && (
            <Chip
              label={`Resolucion ponderada historica: ${formatPercentage(weightedResolution.toFixed(1))}`}
              color="primary"
              variant="filled"
              size="small"
            />
          )}
        </Stack>

        {sortedTrends.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {`Mes actual: ${formatMetric(totalCurrentMonth)} · Mes anterior: ${formatMetric(totalPreviousMonth)}`}
          </Typography>
        )}

        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {isCardsLoading
            ? Array.from({ length: 4 }, (_, index) => (
                <Grid
                  key={`main-type-trend-skeleton-${index}`}
                  size={{ xs: 12, sm: 6, xl: 3 }}
                >
                  <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                    <Stack spacing={1.25}>
                      <Skeleton variant="text" height={30} width="65%" />
                      <Skeleton variant="text" height={40} width="45%" />
                      <Skeleton variant="rounded" height={10} width="100%" />
                      <Skeleton variant="text" height={20} width="80%" />
                      <Skeleton variant="rounded" width={180} height={28} />
                    </Stack>
                  </Paper>
                </Grid>
              ))
            : sortedTrends.map((item) => {
                const current = parseNumber(item.total_mes_actual);
                const progress = totalCurrentMonth
                  ? (current / totalCurrentMonth) * 100
                  : 0;

                return (
                  <Grid
                    key={item.tipo_principal}
                    size={{ xs: 12, sm: 6, xl: 3 }}
                  >
                    <Paper
                      onClick={() => setSelectedMainType(`${item.id}`)}
                      variant="outlined"
                      sx={{
                        p: 2,
                        height: "100%",
                        borderColor: "divider",
                        bgcolor: "background.default",
                        cursor: "pointer",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: 3,
                        },
                      }}
                    >
                      <Stack spacing={1.25}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {item.tipo_principal}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontSize: { xs: 30, md: 34 } }}
                        >
                          {formatMetric(item.total_mes_actual)}
                        </Typography>

                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          color="primary"
                          sx={{ height: 8, borderRadius: 999 }}
                        />

                        <Typography variant="caption" color="text.secondary">
                          {`Historico: ${formatMetric(item.total_historico)} · Abiertas: ${formatMetric(item.abiertas)} · Cerradas: ${formatMetric(item.cerradas)}`}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {`Mes anterior: ${formatMetric(item.total_mes_anterior)} · Abiertas mes: ${formatMetric(item.abiertas_mes_actual)} · Cerradas mes: ${formatMetric(item.cerradas_mes_actual)}`}
                        </Typography>

                        <Chip
                          size="small"
                          icon={getTrendIcon(item.pct_cambio_total)}
                          label={`${formatPercentage(item.pct_cambio_total)} vs mes anterior`}
                          color={getTrendColor(item.pct_cambio_total)}
                          variant="filled"
                          sx={{ alignSelf: "flex-start" }}
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}

          {!isCardsLoading && sortedTrends.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{ p: 2, textAlign: "center", color: "text.secondary" }}
              >
                <Typography variant="body2">
                  No hay datos de tendencia por tipo principal para esta planta.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Stack>
    </Paper>
  );
};

export default MainTypesGlobalTrendAdmin;
