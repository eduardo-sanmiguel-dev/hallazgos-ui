"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { EmployeesService } from "@services";
import FiltersEmployees, {
  DEFAULT_FILTERS_EMPLOYEES,
  type IFiltersEmployeesList,
} from "./_components/FiltersEmployees";
import TableEmployees from "./_components/TableEmployees.";

const EmployeesPage = () => {
  const [filters, setFilters] = useState<IFiltersEmployeesList>(
    DEFAULT_FILTERS_EMPLOYEES,
  );

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "employees",
    filters,
    fetcher: (filters, { page, limit }) =>
      EmployeesService.findAllPaginated({
        page,
        limit,
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
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/employees/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersEmployees
        filters={filters}
        setFilters={setFilters}
        count={count}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableEmployees rows={data} getData={getData} pagination={pagination} />
      )}
    </>
  );
};

export default EmployeesPage;
