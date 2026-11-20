import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useRestoredPlantId, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkObserversService } from "@services";
import TableGembaWalkObservers, {
  GEMBA_WALK_OBSERVER_DEFAULT_SORT,
  GEMBA_WALK_OBSERVER_SORT_OPTIONS,
} from "./_components/TableGembaWalkObservers";
import FiltersGembaWalkObservers, {
  IFiltersGembaWalkObservers,
} from "./_components/FiltersGembaWalkObservers";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkObservers => ({
  manufacturingPlantId: "",
  gembaWalkZoneId: "",
  userName: "",
});

const GembaWalkObserversPage = () => {
  // Con la planta que restaura su filtro: la primera página sale una vez.
  const restoredPlant = useRestoredPlantId();
  const [filters, setFilters] = useState<IFiltersGembaWalkObservers>(() => ({
    ...defaultFilters(),
    manufacturingPlantId: restoredPlant,
  }));

  const router = useRouter();

  const sort = useTableSort(
    "gemba-walk/observers",
    GEMBA_WALK_OBSERVER_SORT_OPTIONS,
    GEMBA_WALK_OBSERVER_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/observers",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      GembaWalkObserversService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Gemba Walk - Observadores">
        <Button
          data-dd-action-name="Asignar observadores de Gemba Walk"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/observers/form")}
        >
          Asignar observadores
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkObservers
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
        <TableGembaWalkObservers
          sorting={sort}
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkObserversPage;
