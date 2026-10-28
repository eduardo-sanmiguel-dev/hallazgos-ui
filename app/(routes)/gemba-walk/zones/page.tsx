"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkZonesService } from "@services";
import TableGembaWalkZones from "./_components/TableGembaWalkZones";
import FiltersGembaWalkZones, {
  IFiltersGembaWalkZones,
} from "./_components/FiltersGembaWalkZones";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkZones => ({
  nameZone: "",
  nameLocation: "",
  manufacturingPlantId: "",
});

const GembaWalkZonesPage = () => {
  const [filters, setFilters] =
    useState<IFiltersGembaWalkZones>(defaultFilters);

  const router = useRouter();

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
    fetcher: (filters, { page, limit }) =>
      GembaWalkZonesService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Gemba Walk - Zonas">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/zones/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkZones
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableGembaWalkZones
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkZonesPage;
