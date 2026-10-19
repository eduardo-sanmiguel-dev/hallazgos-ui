"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { MainTypesService } from "@services";
import TableMainTypes from "./_components/TableMainTypes";
import FiltersMainTypes, {
  IFiltersMainTypes,
} from "./_components/FiltersMainTypes";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersMainTypes => ({
  name: "",
});

const MainTypesPage = () => {
  const [filters, setFilters] = useState<IFiltersMainTypes>(defaultFilters);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "main-types",
    filters,
    fetcher: (filters, { page, limit }) =>
      MainTypesService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Criterios">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/main-types/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersMainTypes
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableMainTypes rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default MainTypesPage;
