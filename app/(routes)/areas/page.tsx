"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { AreasService } from "@services";
import TableAreas from "./_components/TableAreas";
import FiltersAreas, {
  DEFAULT_FILTERS_AREAS,
  type IFiltersAreas,
} from "./_components/FiltersAreas";

const AreasPage = () => {
  const [filters, setFilters] = useState<IFiltersAreas>(DEFAULT_FILTERS_AREAS);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "areas",
    allowAllRows: true,
    filters,
    fetcher: (filters, { page, limit }) =>
      AreasService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

  return (
    <>
      <PageHeader title="Zonas">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/areas/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersAreas filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableAreas rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default AreasPage;
