"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkZonesService } from "@services";
import { GembaWalkZone } from "@interfaces";
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
  const [data, setData] = useState<GembaWalkZone[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] =
    useState<IFiltersGembaWalkZones>(defaultFilters);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkZonesService.findAllPaginated({
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
        <LoadingLinear />
      ) : (
        <TableGembaWalkZones
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

export default GembaWalkZonesPage;
