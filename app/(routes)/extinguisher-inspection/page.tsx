"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import Button from "@mui/material/Button";
import Add from "@mui/icons-material/Add";

import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { ExtinguisherInspectionsService } from "@services";
import ExtinguisherInspectionsTable from "./_components/ExtinguisherInspectionsTable";
import FiltersExtinguisherInspections, {
  DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  IFiltersExtinguisherInspections,
} from "./_components/FiltersExtinguisherInspections";

const ExtinguisherInspectionPage = () => {
  const [filters, setFilters] = useState<IFiltersExtinguisherInspections>(
    DEFAULT_FILTERS_EXTINGUISHER_INSPECTIONS,
  );

  const router = useRouter();

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "extinguisher-inspection",
    filters,
    fetcher: (filters, { page, limit }) =>
      ExtinguisherInspectionsService.findAllPaginated({
        ...filters,
        page,
        limit,
      }),
  });

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
        <TableSkeleton />
      ) : (
        <ExtinguisherInspectionsTable rows={data} pagination={pagination} />
      )}
    </>
  );
};

export default ExtinguisherInspectionPage;
