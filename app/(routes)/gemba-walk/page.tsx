"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useDebouncedCallback } from "use-debounce";
import moment from "moment-timezone";

import LoadingLinear from "@shared/components/LoadingLinear";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { GembaWalksService } from "@services";
import { GembaWalk } from "@interfaces";
import GembaWalkAccessGuard from "./_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar from "@shared/components/FilterBar";
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
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
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
        >
          Ver calendario
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <RefreshButton onClick={() => getData()} />
      </Box>
      <FilterBar count={data.length}>
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
      </FilterBar>
      {isLoading ? <LoadingLinear /> : <TableGembaWalks rows={data} />}
    </>
  );
};

const GembaWalksPage = () => (
  <>
    <PageHeader title="Gemba Walk - Recorridos" />
    <GembaWalkAccessGuard>
      <GembaWalksList />
    </GembaWalkAccessGuard>
  </>
);

export default GembaWalksPage;
