"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkEvaluationsService } from "@services";
import { GembaWalkEvaluation } from "@interfaces";
import TableGembaWalkEvaluations from "./_components/TableGembaWalkEvaluations";
import FiltersGembaWalkEvaluations, {
  IFiltersGembaWalkEvaluations,
} from "./_components/FiltersGembaWalkEvaluations";

const GembaWalkEvaluationsPage = () => {
  const [data, setData] = useState<GembaWalkEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersGembaWalkEvaluations>({
    manufacturingPlantId: "",
    category: "",
    search: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkEvaluationsService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Gemba Walk - Evaluaciones">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/evaluations/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkEvaluations
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkEvaluations rows={data} getData={getData} />
      )}
    </>
  );
};

export default GembaWalkEvaluationsPage;
