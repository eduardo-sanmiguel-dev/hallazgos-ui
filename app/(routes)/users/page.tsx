"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { UsersService } from "@services";
import { User } from "@interfaces";
import TableUsers from "./_components/TableUsers";
import FiltersUsers, { IFiltersUsers } from "./_components/FiltersUsers";

const UsersPage = () => {
  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersUsers>({
    name: "",
    manufacturingPlantId: "",
    rule: "",
    zoneId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    UsersService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Usuarios">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/users/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersUsers
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableUsers rows={data} getData={getData} />
      )}
    </>
  );
};

export default UsersPage;
