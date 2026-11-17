import { useState } from "react";

import { useRouter } from "@shared/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList, useTableSort } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { EmployeesService } from "@services";
import FiltersEmployees, {
  DEFAULT_FILTERS_EMPLOYEES,
  type IFiltersEmployeesList,
} from "./_components/FiltersEmployees";
import TableEmployees, {
  EMPLOYEE_DEFAULT_SORT,
  EMPLOYEE_SORT_OPTIONS,
} from "./_components/TableEmployees.";

const EmployeesPage = () => {
  const [filters, setFilters] = useState<IFiltersEmployeesList>(DEFAULT_FILTERS_EMPLOYEES);

  const router = useRouter();

  const sort = useTableSort("employees", EMPLOYEE_SORT_OPTIONS, EMPLOYEE_DEFAULT_SORT);

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "employees",
    filters,
    sort: sort.sort,
    fetcher: (filters, { page, limit, ...sorting }) =>
      EmployeesService.findAllPaginated({
        page,
        limit,
        ...sorting,
        name: filters.name,
        manufacturingPlantId: Number(filters.manufacturingPlantId || 0),
        areaId: filters.areaId,
        positionId: filters.positionId,
        genreId: filters.genreId,
        isActive: filters.isActive,
      }),
  });

  return (
    <>
      <PageHeader title="Colaboradores">
        <Button
          data-dd-action-name="Crear colaborador"
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/employees/form")}
        >
          Crear colaborador
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersEmployees sort={sort} filters={filters} setFilters={setFilters} count={count} />
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <TableEmployees sorting={sort} rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default EmployeesPage;
