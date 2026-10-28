"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { SecondaryTypesService } from "@services";
import TableSecondaryTypes from "./_components/TableSecondaryTypes";
import FiltersSecondaryTypes, {
  IFiltersSecondaryTypes,
} from "./_components/FiltersSecondaryTypes";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersSecondaryTypes => ({
  name: "",
  mainTypeId: "",
});

const SecondaryTypesPage = () => {
  const [filters, setFilters] =
    useState<IFiltersSecondaryTypes>(defaultFilters);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "secondary-types",
    allowAllRows: true,
    filters,
    fetcher: (filters, { page, limit }) =>
      SecondaryTypesService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Tipos de criterios">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/secondary-types/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersSecondaryTypes
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableSecondaryTypes
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default SecondaryTypesPage;
