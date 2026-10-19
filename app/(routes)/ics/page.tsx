"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Add from "@mui/icons-material/Add";
import { Button } from "@mui/material";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FiltersIcs, {
  DEFAULT_FILTERS_ICS,
  type IFiltersIcs,
} from "./_components/FiltersIcs";
import TableIcs from "./_components/TableIcs";
import { IcsService } from "@services";

const IcsPage = () => {
  const [filters, setFilters] = useState<IFiltersIcs>(DEFAULT_FILTERS_ICS);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "ics",
    filters,
    fetcher: (filters, { page, limit }) =>
      IcsService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

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
        <TableIcs rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default IcsPage;
