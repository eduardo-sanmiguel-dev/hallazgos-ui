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
import FiltersIcs, { type IFiltersIcs } from "./_components/FiltersIcs";
import TableIcs from "./_components/TableIcs";
import { IcsService } from "@services";

const IcsPage = () => {
  const [data, setData] = useState<ICSData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersIcs>({
    name: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    IcsService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

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
      <FiltersIcs
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableIcs rows={data} getData={getData} />
      )}
    </>
  );
};

export default IcsPage;
