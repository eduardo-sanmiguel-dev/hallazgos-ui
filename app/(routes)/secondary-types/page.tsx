"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { SecondaryTypesService } from "@services";
import { SecondaryType } from "@interfaces";
import TableSecondaryTypes from "./_components/TableSecondaryTypes";
import FiltersSecondaryTypes, {
  IFiltersSecondaryTypes,
} from "./_components/FiltersSecondaryTypes";

const SecondaryTypesPage = () => {
  const [data, setData] = useState<SecondaryType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersSecondaryTypes>({
    name: "",
    mainTypeId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    SecondaryTypesService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Tipos de criterios">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/secondary-types/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersSecondaryTypes
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableSecondaryTypes rows={data} getData={getData} />
      )}
    </>
  );
};

export default SecondaryTypesPage;
