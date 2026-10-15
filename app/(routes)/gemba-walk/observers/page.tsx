"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkObserversService } from "@services";
import { GembaWalkObserver } from "@interfaces";
import TableGembaWalkObservers from "./_components/TableGembaWalkObservers";
import FiltersGembaWalkObservers, {
  IFiltersGembaWalkObservers,
} from "./_components/FiltersGembaWalkObservers";

const GembaWalkObserversPage = () => {
  const [data, setData] = useState<GembaWalkObserver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersGembaWalkObservers>({
    manufacturingPlantId: "",
    gembaWalkZoneId: "",
    userName: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkObserversService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Gemba Walk - Observadores">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/observers/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkObservers
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkObservers rows={data} getData={getData} />
      )}
    </>
  );
};

export default GembaWalkObserversPage;
