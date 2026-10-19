"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ManufacturingPlantsService } from "@services";
import TableManufacturingPlants from "./_components/TableManufacturingPlants";
import FiltersManufacturingPlants, {
  DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  type IFiltersManufacturingPlants,
} from "./_components/FiltersManufacturingPlants";

const ManufacturingPlantsPage = () => {
  const [filters, setFilters] = useState<IFiltersManufacturingPlants>(
    DEFAULT_FILTERS_MANUFACTURING_PLANTS,
  );

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "manufacturing-plants",
    filters,
    fetcher: (filters, { page, limit }) =>
      ManufacturingPlantsService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

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
          pagination={pagination}
        />
      )}
    </>
  );
};

export default ManufacturingPlantsPage;
