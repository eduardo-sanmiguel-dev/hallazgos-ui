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
  IFiltersExtinguisherInspections,
} from "./_components/FiltersExtinguisherInspections";

const ExtinguisherInspectionPage = () => {
  const [data, setData] = useState<ExtinguisherInspection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersExtinguisherInspections>({
    search: "",
    manufacturingPlantId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    ExtinguisherInspectionsService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

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
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <ExtinguisherInspectionsTable rows={data} />
      )}
    </>
  );
};

export default ExtinguisherInspectionPage;
