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
import FiltersUsers, {
  DEFAULT_FILTERS_USERS,
  IFiltersUsers,
} from "./_components/FiltersUsers";

const UsersPage = () => {
  const [data, setData] = useState<User[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersUsers>(DEFAULT_FILTERS_USERS);

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    UsersService.findAllPaginated({
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
        <TableUsers
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

export default UsersPage;
