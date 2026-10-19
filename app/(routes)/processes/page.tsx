"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ProcessesService } from "@services";
import TableProcesses from "./_components/TableProcesses";
import FiltersProcesses, {
  DEFAULT_FILTERS_PROCESSES,
  type IFiltersProcesses,
} from "./_components/FiltersProcesses";

const ProcessesPage = () => {
  const [filters, setFilters] = useState<IFiltersProcesses>(
    DEFAULT_FILTERS_PROCESSES,
  );

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "processes",
    filters,
    fetcher: (filters, { page, limit }) =>
      ProcessesService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

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
        count={count}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableProcesses rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default ProcessesPage;
