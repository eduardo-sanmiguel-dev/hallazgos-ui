"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkObserversService } from "@services";
import TableGembaWalkObservers from "./_components/TableGembaWalkObservers";
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
  const [filters, setFilters] =
    useState<IFiltersGembaWalkObservers>(defaultFilters);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/observers",
    filters,
    fetcher: (filters, { page, limit }) =>
      GembaWalkObserversService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Gemba Walk - Observadores">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/observers/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkObservers
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkObservers
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkObserversPage;
