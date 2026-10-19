"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import moment from "moment-timezone";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkCalendarService } from "@services";
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
  const [filters, setFilters] =
    useState<IFiltersGembaWalkCalendar>(defaultFilters);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/calendar",
    filters,
    fetcher: (filters, { page, limit }) =>
      // Los días del filtro son locales; endDate se envía exclusivo (día siguiente).
      GembaWalkCalendarService.findAllPaginated({
        page,
        limit,
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
      }),
  });

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
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkCalendarPage;
