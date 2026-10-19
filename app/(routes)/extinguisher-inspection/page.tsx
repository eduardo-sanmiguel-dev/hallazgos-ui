"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@mui/material/Button";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ExtinguisherInspectionsService } from "@services";
import { ExtinguisherInspection } from "@interfaces";
import ExtinguisherInspectionsTable from "./_components/ExtinguisherInspectionsTable";
import FiltersExtinguisherInspections, {
  DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  IFiltersExtinguisherInspections,
} from "./_components/FiltersExtinguisherInspections";

const ExtinguisherInspectionPage = () => {
  const [data, setData] = useState<ExtinguisherInspection[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersExtinguisherInspections>(
    DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  );

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ExtinguisherInspectionsService.findAllPaginated({
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
      <PageHeader title="Inspecciones de extintores">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/extinguisher-inspection/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersExtinguisherInspections
        filters={filters}
        setFilters={setFilters}
        count={count}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <ExtinguisherInspectionsTable
          rows={data}
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

export default ExtinguisherInspectionPage;
