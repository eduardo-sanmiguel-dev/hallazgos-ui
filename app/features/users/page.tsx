import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useRestoredPlantId, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { UsersService } from "@services";
import TableUsers, { USER_DEFAULT_SORT, USER_SORT_OPTIONS } from "./_components/TableUsers";
import FiltersUsers, { DEFAULT_FILTERS_USERS, IFiltersUsers } from "./_components/FiltersUsers";

const UsersPage = () => {
  // Con la planta que restaura su filtro: la primera página sale una vez.
  const restoredPlant = useRestoredPlantId();
  const [filters, setFilters] = useState<IFiltersUsers>(() => ({
    ...DEFAULT_FILTERS_USERS,
    manufacturingPlantId: restoredPlant,
  }));

  const router = useRouter();

  const sort = useTableSort("users", USER_SORT_OPTIONS, USER_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "users",
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      UsersService.findAllPaginated({
        ...filters,
        page,
        limit,
        ...sorting,
      }),
  });

  return (
    <>
      <PageHeader title="Usuarios">
        <Button
          data-dd-action-name="Crear usuario"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/users/form")}
        >
          Crear usuario
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersUsers sort={sort} filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableUsers sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default UsersPage;
