"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { UsersService } from "@services";
import TableUsers from "./_components/TableUsers";
import FiltersUsers, {
  DEFAULT_FILTERS_USERS,
  IFiltersUsers,
} from "./_components/FiltersUsers";

const UsersPage = () => {
  const [filters, setFilters] = useState<IFiltersUsers>(DEFAULT_FILTERS_USERS);

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "users",
    filters,
    fetcher: (filters, { page, limit }) =>
      UsersService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

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
      <FiltersUsers filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableUsers rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default UsersPage;
