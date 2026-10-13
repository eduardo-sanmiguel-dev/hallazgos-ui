"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { ButtonGroup } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import { Typography } from "@mui/material";
import moment from "moment-timezone";

import LoadingLinear from "@shared/components/LoadingLinear";
import { GembaWalkCalendarService } from "@services";
import { GembaWalkCalendar } from "@interfaces";
import TableGembaWalkCalendar from "./_components/TableGembaWalkCalendar";
import FiltersGembaWalkCalendar, {
  IFiltersGembaWalkCalendar,
} from "./_components/FiltersGembaWalkCalendar";

const GembaWalkCalendarPage = () => {
  const [data, setData] = useState<GembaWalkCalendar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersGembaWalkCalendar>({
    manufacturingPlantId: "",
    gembaWalkZoneId: "",
    startDate: moment().startOf("month").format("YYYY-MM-DD"),
    endDate: moment().endOf("month").format("YYYY-MM-DD"),
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    // Los días del filtro son locales; endDate se envía exclusivo (día siguiente).
    GembaWalkCalendarService.findAll({
      manufacturingPlantId: filters.manufacturingPlantId,
      gembaWalkZoneId: filters.gembaWalkZoneId,
      ...(filters.startDate && {
        startDate: moment(filters.startDate, "YYYY-MM-DD")
          .startOf("day")
          .toISOString(),
      }),
      ...(filters.endDate && {
        endDate: moment(filters.endDate, "YYYY-MM-DD")
          .add(1, "day")
          .startOf("day")
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
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
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
          Gemba Walk - Calendario
        </Typography>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={() =>
                router.push(
                  "/gemba-walk/calendar/form" +
                    (filters.manufacturingPlantId
                      ? `?manufacturingPlantId=${filters.manufacturingPlantId}`
                      : ""),
                )
              }
            >
              Crear / Editar en calendario
            </Button>
          </Box>

          <ButtonGroup
            variant="contained"
            aria-label="outlined primary button group"
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => getData()}
            ></Button>
          </ButtonGroup>
        </Toolbar>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <FiltersGembaWalkCalendar
          filters={filters}
          setFilters={setFilters}
          count={data.length}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        {isLoading ? (
          <LoadingLinear />
        ) : (
          <TableGembaWalkCalendar rows={data} getData={getData} />
        )}
      </Grid>
    </Grid>
  );
};

export default GembaWalkCalendarPage;
