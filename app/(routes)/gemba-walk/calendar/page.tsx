"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useDebouncedCallback } from "use-debounce";
import moment from "moment-timezone";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkCalendarService } from "@services";
import { GembaWalkCalendar } from "@interfaces";
import TableGembaWalkCalendar from "./_components/TableGembaWalkCalendar";
import FiltersGembaWalkCalendar, {
  IFiltersGembaWalkCalendar,
} from "./_components/FiltersGembaWalkCalendar";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkCalendar => ({
  manufacturingPlantId: "",
  gembaWalkZoneId: "",
  startDate: moment().startOf("month").format("YYYY-MM-DD"),
  endDate: moment().endOf("month").format("YYYY-MM-DD"),
  isAdditional: "",
});

const GembaWalkCalendarPage = () => {
  const [data, setData] = useState<GembaWalkCalendar[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] =
    useState<IFiltersGembaWalkCalendar>(defaultFilters);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    // Los días del filtro son locales; endDate se envía exclusivo (día siguiente).
    GembaWalkCalendarService.findAllPaginated({
      page: page + 1,
      limit: rowsPerPage,
      manufacturingPlantId: filters.manufacturingPlantId,
      gembaWalkZoneId: filters.gembaWalkZoneId,
      isAdditional: filters.isAdditional,
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
      .then(({ data, count }) => {
        setData(data);
        setCount(count);
      })
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

  return (
    <>
      <PageHeader title="Gemba Walk - Calendario">
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
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkCalendar
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkCalendar
          rows={data}
          getData={getData}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={count}
        />
      )}
    </>
  );
};

export default GembaWalkCalendarPage;
