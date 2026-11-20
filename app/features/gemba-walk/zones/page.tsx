import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useRestoredPlantId, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkZonesService } from "@services";
import TableGembaWalkZones, {
  GEMBA_WALK_ZONE_DEFAULT_SORT,
  GEMBA_WALK_ZONE_SORT_OPTIONS,
} from "./_components/TableGembaWalkZones";
import FiltersGembaWalkZones, { IFiltersGembaWalkZones } from "./_components/FiltersGembaWalkZones";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkZones => ({
  nameZone: "",
  nameLocation: "",
  manufacturingPlantId: "",
});

const GembaWalkZonesPage = () => {
  // Con la planta que restaura su filtro: la primera página sale una vez.
  const restoredPlant = useRestoredPlantId();
  const [filters, setFilters] = useState<IFiltersGembaWalkZones>(() => ({
    ...defaultFilters(),
    manufacturingPlantId: restoredPlant,
  }));

  const router = useRouter();

  const sort = useTableSort(
    "gemba-walk/zones",
    GEMBA_WALK_ZONE_SORT_OPTIONS,
    GEMBA_WALK_ZONE_DEFAULT_SORT,
  );

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/zones",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      GembaWalkZonesService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Gemba Walk - Zonas">
        <Button
          data-dd-action-name="Crear zona de Gemba Walk"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/zones/form")}
        >
          Crear zona
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkZones
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
        <TableGembaWalkZones sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default GembaWalkZonesPage;
