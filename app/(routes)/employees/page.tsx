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
  type IFiltersEmployees,
} from "./_components/FiltersEmployees";
import TableEmployees from "./_components/TableEmployees.";

const EmployeesPage = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersEmployees>({
    name: "",
    isActive: "true",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    EmployeesService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

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
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableEmployees rows={data} getData={getData} />
      )}
    </>
  );
};

export default EmployeesPage;
