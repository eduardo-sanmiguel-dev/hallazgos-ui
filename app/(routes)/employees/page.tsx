"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { EmployeesService } from "@services";
import { Employee } from "@interfaces";
import FiltersEmployees, {
  DEFAULT_FILTERS_EMPLOYEES,
  type IFiltersEmployeesList,
} from "./_components/FiltersEmployees";
import TableEmployees from "./_components/TableEmployees.";

const EmployeesPage = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersEmployeesList>(
    DEFAULT_FILTERS_EMPLOYEES,
  );

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    EmployeesService.findAllPaginated({
      page: page + 1,
      limit: rowsPerPage,
      name: filters.name,
      manufacturingPlantId: Number(filters.manufacturingPlantId || 0),
      areaId: filters.areaId,
      positionId: filters.positionId,
      genreId: filters.genreId,
      isActive: filters.isActive,
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
        <TableEmployees
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

export default EmployeesPage;
