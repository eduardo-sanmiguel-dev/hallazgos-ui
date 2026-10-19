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
  DEFAULT_FILTERS_PROCESSES,
  type IFiltersProcesses,
} from "./_components/FiltersProcesses";

const ProcessesPage = () => {
  const [data, setData] = useState<Processes[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersProcesses>(
    DEFAULT_FILTERS_PROCESSES,
  );

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ProcessesService.findAllPaginated({
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
        <TableProcesses
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

export default ProcessesPage;
