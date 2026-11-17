import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ZonesService } from "@services";
import TableZones, { ZONE_DEFAULT_SORT, ZONE_SORT_OPTIONS } from "./_components/TableZones";
import FiltersZones, {
  DEFAULT_FILTERS_ZONES,
  type IFiltersZones,
} from "./_components/FiltersZones";

const ZonesPage = () => {
  const [filters, setFilters] = useState<IFiltersZones>(DEFAULT_FILTERS_ZONES);

  const router = useRouter();

  const sort = useTableSort("zones", ZONE_SORT_OPTIONS, ZONE_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "zones",
    allowAllRows: true,
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      ZonesService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Lugares">
        <Button
          data-dd-action-name="Crear zona"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/zones/form")}
        >
          Crear zona
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersZones sort={sort} filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableZones sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default ZonesPage;
