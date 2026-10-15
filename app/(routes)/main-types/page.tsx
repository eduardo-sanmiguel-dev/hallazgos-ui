"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { MainTypesService } from "@services";
import { MainType } from "@interfaces";
import TableMainTypes from "./_components/TableMainTypes";
import FiltersMainTypes, {
  IFiltersMainTypes,
} from "./_components/FiltersMainTypes";

const MainTypesPage = () => {
  const [data, setData] = useState<MainType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersMainTypes>({
    name: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    MainTypesService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Criterios">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/main-types/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersMainTypes
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableMainTypes rows={data} getData={getData} />
      )}
    </>
  );
};

export default MainTypesPage;
