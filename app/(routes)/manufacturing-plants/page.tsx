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
  IFiltersManufacturingPlants,
} from "./_components/FiltersManufacturingPlants";

const ManufacturingPlantsPage = () => {
  const [data, setData] = useState<ManufacturingPlant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersManufacturingPlants>({
    name: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ManufacturingPlantsService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

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
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableManufacturingPlants rows={data} getData={getData} />
      )}
    </>
  );
};

export default ManufacturingPlantsPage;
