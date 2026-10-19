"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkObserversService } from "@services";
import { GembaWalkObserver } from "@interfaces";
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
  const [data, setData] = useState<GembaWalkObserver[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] =
    useState<IFiltersGembaWalkObservers>(defaultFilters);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkObserversService.findAllPaginated({
      ...filters,
      page: page + 1,
      limit: rowsPerPage,
    })
      .then(({ data, count }) => {
        setData(data);
        setCount(count);
      })
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [filters]);

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
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          count={count}
        />
      )}
    </>
  );
};

export default GembaWalkObserversPage;
