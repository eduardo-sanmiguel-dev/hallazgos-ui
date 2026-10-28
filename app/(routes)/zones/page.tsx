"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ZonesService } from "@services";
import TableZones from "./_components/TableZones";
import FiltersZones, {
  DEFAULT_FILTERS_ZONES,
  type IFiltersZones,
} from "./_components/FiltersZones";

const ZonesPage = () => {
  const [filters, setFilters] = useState<IFiltersZones>(DEFAULT_FILTERS_ZONES);

  const router = useRouter();

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
    fetcher: (filters, { page, limit }) =>
      ZonesService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Lugares">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/zones/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersZones filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableZones rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default ZonesPage;
