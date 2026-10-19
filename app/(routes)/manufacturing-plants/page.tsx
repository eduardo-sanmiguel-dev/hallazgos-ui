"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ManufacturingPlantsService } from "@services";
import { ManufacturingPlant } from "@interfaces";
import TableManufacturingPlants from "./_components/TableManufacturingPlants";
import FiltersManufacturingPlants, {
  DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  type IFiltersManufacturingPlants,
} from "./_components/FiltersManufacturingPlants";

const ManufacturingPlantsPage = () => {
  const [data, setData] = useState<ManufacturingPlant[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersManufacturingPlants>(
    DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  );

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ManufacturingPlantsService.findAllPaginated({
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
      <PageHeader title="Plantas">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/manufacturing-plants/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersManufacturingPlants
        filters={filters}
        setFilters={setFilters}
        count={count}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableManufacturingPlants
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

export default ManufacturingPlantsPage;
