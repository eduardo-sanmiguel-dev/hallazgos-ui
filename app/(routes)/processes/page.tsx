"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ProcessesService } from "@services";
import { Processes } from "@interfaces";
import TableProcesses from "./_components/TableProcesses";
import FiltersProcesses, {
  IFiltersProcesses,
} from "./_components/FiltersProcesses";

const ProcessesPage = () => {
  const [data, setData] = useState<Processes[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersProcesses>({
    name: "",
    manufacturingPlantId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ProcessesService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Procesos">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/processes/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersProcesses
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableProcesses rows={data} getData={getData} />
      )}
    </>
  );
};

export default ProcessesPage;
