"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import { Typography } from "@mui/material";
import { ButtonGroup } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Add from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useDebouncedCallback } from "use-debounce";
import moment from "moment-timezone";

import LoadingLinear from "@shared/components/LoadingLinear";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { GembaWalksService } from "@services";
import { GembaWalk } from "@interfaces";
import GembaWalkAccessGuard from "./_components/GembaWalkAccessGuard";
import TableGembaWalks from "./_components/TableGembaWalks";
import DateFieldDMY from "./calendar/_components/DateFieldDMY";

const GembaWalksList = () => {
  const [data, setData] = useState<GembaWalk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    manufacturingPlantId: "",
    startDate: moment().startOf("month").format("YYYY-MM-DD"),
    endDate: moment().endOf("month").format("YYYY-MM-DD"),
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    // Días locales del filtro; endDate se envía exclusivo (día siguiente).
    GembaWalksService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
      ...(filters.startDate && {
        startDate: moment(filters.startDate, "YYYY-MM-DD").toISOString(),
      }),
      ...(filters.endDate && {
        endDate: moment(filters.endDate, "YYYY-MM-DD")
          .add(1, "day")
          .toISOString(),
      }),
    })
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => router.push("/gemba-walk/form")}
            >
              Registrar recorrido
            </Button>
            <Button
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
              onClick={() => router.push("/gemba-walk/schedule")}
              sx={{ ml: 2 }}
            >
              Ver calendario
            </Button>
          </Box>

          <ButtonGroup variant="contained">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => getData()}
            ></Button>
          </ButtonGroup>
        </Toolbar>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                color: (theme) =>
                  theme.palette.mode === "light"
                    ? theme.palette.common.black
                    : theme.palette.common.white,
              }}
            >
              <FilterListIcon sx={{ pt: 1 }} /> Filtros ({data.length})
            </Typography>
          </Grid>
          <SelectManufacturingPlantsOwn
            value={filters.manufacturingPlantId}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                manufacturingPlantId: e.target.value,
              }))
            }
            isFilter={true}
          />
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DateFieldDMY
              label="Desde"
              value={filters.startDate}
              onChange={(startDate) =>
                setFilters((prev) => ({ ...prev, startDate }))
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DateFieldDMY
              label="Hasta"
              value={filters.endDate}
              onChange={(endDate) =>
                setFilters((prev) => ({ ...prev, endDate }))
              }
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12 }}>
        {isLoading ? <LoadingLinear /> : <TableGembaWalks rows={data} />}
      </Grid>
    </Grid>
  );
};

const GembaWalksPage = () => (
  <Grid container>
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.common.black
              : theme.palette.common.white,
        }}
      >
        Gemba Walk - Recorridos
      </Typography>
    </Grid>
    <Grid size={{ xs: 12 }}>
      <GembaWalkAccessGuard>
        <GembaWalksList />
      </GembaWalkAccessGuard>
    </Grid>
  </Grid>
);

export default GembaWalksPage;
