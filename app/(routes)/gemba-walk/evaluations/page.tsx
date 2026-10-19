"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkEvaluationsService } from "@services";
import TableGembaWalkEvaluations from "./_components/TableGembaWalkEvaluations";
import FiltersGembaWalkEvaluations, {
  IFiltersGembaWalkEvaluations,
} from "./_components/FiltersGembaWalkEvaluations";

// Valores iniciales de los filtros (también para "Limpiar filtros").
const defaultFilters = (): IFiltersGembaWalkEvaluations => ({
  manufacturingPlantId: "",
  category: "",
  search: "",
});

const GembaWalkEvaluationsPage = () => {
  const [filters, setFilters] =
    useState<IFiltersGembaWalkEvaluations>(defaultFilters);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "gemba-walk/evaluations",
    filters,
    fetcher: (filters, { page, limit }) =>
      GembaWalkEvaluationsService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Gemba Walk - Evaluaciones">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/evaluations/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkEvaluations
        filters={filters}
        setFilters={setFilters}
        count={count}
        canClear={JSON.stringify(filters) !== JSON.stringify(defaultFilters())}
        onClear={() => setFilters(defaultFilters())}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkEvaluations
          rows={data}
          getData={getData}
          pagination={pagination}
        />
      )}
    </>
  );
};

export default GembaWalkEvaluationsPage;
