import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs, { toISOStringOrNull } from "@shared/libs/dayjs";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkCalendarService } from "@services";
import TableGembaWalkCalendar, {
  GEMBA_WALK_CALENDAR_DEFAULT_SORT,
  GEMBA_WALK_CALENDAR_SORT_OPTIONS,
} from "./_components/TableGembaWalkCalendar";
import FiltersGembaWalkCalendar, {
  IFiltersGembaWalkCalendar,
} from "./_components/FiltersGembaWalkCalendar";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkCalendar => ({
  manufacturingPlantId: "",
  gembaWalkZoneId: "",
  startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
  endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  isAdditional: "",
});

const GembaWalkCalendarPage = () => {
  const [filters, setFilters] = useState<IFiltersGembaWalkCalendar>(defaultFilters);

  const router = useRouter();

  const sort = useTableSort(
    "gemba-walk/calendar",
    GEMBA_WALK_CALENDAR_SORT_OPTIONS,
    GEMBA_WALK_CALENDAR_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/calendar",
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      // Los días del filtro son locales; endDate se envía exclusivo (día siguiente).
      GembaWalkCalendarService.findAllPaginated({
        page,
        limit,
        ...sorting,
        manufacturingPlantId: filters.manufacturingPlantId,
        gembaWalkZoneId: filters.gembaWalkZoneId,
        isAdditional: filters.isAdditional,
        ...(filters.startDate && {
          startDate: toISOStringOrNull(dayjs(filters.startDate, "YYYY-MM-DD").startOf("day")),
        }),
        ...(filters.endDate && {
          endDate: toISOStringOrNull(
            dayjs(filters.endDate, "YYYY-MM-DD").add(1, "day").startOf("day"),
          ),
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
        sort={sort}
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableGembaWalkCalendar
          sorting={sort}
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkCalendarPage;
