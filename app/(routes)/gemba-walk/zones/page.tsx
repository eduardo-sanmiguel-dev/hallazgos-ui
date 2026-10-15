"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@mui/material";
import Add from "@mui/icons-material/Add";
import { useDebouncedCallback } from "use-debounce";

import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { GembaWalkZonesService } from "@services";
import { GembaWalkZone } from "@interfaces";
import TableGembaWalkZones from "./_components/TableGembaWalkZones";
import FiltersGembaWalkZones, {
  IFiltersGembaWalkZones,
} from "./_components/FiltersGembaWalkZones";

const GembaWalkZonesPage = () => {
  const [data, setData] = useState<GembaWalkZone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<IFiltersGembaWalkZones>({
    nameZone: "",
    nameLocation: "",
    manufacturingPlantId: "",
  });

  const router = useRouter();

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    GembaWalkZonesService.findAll(filters)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  return (
    <>
      <PageHeader title="Gemba Walk - Zonas">
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push("/gemba-walk/zones/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FiltersGembaWalkZones
        filters={filters}
        setFilters={setFilters}
        count={data.length}
      />
      {isLoading ? (
        <LoadingLinear />
      ) : (
        <TableGembaWalkZones rows={data} getData={getData} />
      )}
    </>
  );
};

export default GembaWalkZonesPage;
