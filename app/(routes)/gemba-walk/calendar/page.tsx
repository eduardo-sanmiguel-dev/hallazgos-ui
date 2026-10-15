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
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkCalendar rows={data} getData={getData} />
      )}
    </>
  );
};

export default GembaWalkCalendarPage;
