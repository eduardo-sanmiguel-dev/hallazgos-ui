"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Add from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ICSData } from "@interfaces";
import FiltersIcs, {
  DEFAULT_FILTERS_ICS,
  type IFiltersIcs,
} from "./_components/FiltersIcs";
import TableIcs from "./_components/TableIcs";
import { IcsService } from "@services";

const IcsPage = () => {
  const [data, setData] = useState<ICSData[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersIcs>(DEFAULT_FILTERS_ICS);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    IcsService.findAllPaginated({
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
      <PageHeader title="Índice de Comportamiento Seguro">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/ics/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersIcs filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableIcs
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

export default IcsPage;
