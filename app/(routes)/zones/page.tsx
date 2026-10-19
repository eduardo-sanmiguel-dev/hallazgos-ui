"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ZonesService } from "@services";
import { Zone } from "@interfaces";
import TableZones from "./_components/TableZones";
import FiltersZones, {
  DEFAULT_FILTERS_ZONES,
  type IFiltersZones,
} from "./_components/FiltersZones";

const ZonesPage = () => {
  const [data, setData] = useState<Zone[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersZones>(DEFAULT_FILTERS_ZONES);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ZonesService.findAllPaginated({
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
      <PageHeader title="Lugares">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/zones/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersZones filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableZones
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

export default ZonesPage;
