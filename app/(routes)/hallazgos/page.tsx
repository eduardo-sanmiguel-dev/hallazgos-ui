"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { toast } from "sonner";

import TableEvidences from "./_components/TableEvidences";
import { TableSkeleton } from "@shared/components/Skeletons";
import ErrorState from "@shared/components/ErrorState";
import FiltersEvidence, {
  FiltersEvidences,
} from "./_components/FiltersEvidence";
import { useEvidences } from "@hooks";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import { EvidencesService } from "@services";

export default function HallazgosPage() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersEvidences>({
    evidenceId: "",
    manufacturingPlantId: "",
    mainTypeIds: [],
    secondaryTypeIds: [],
    areaIds: [],
    zoneIds: [],
    responsibleIds: [],
    states: [],
    startDate: "",
    endDate: "",
  });

  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isLoadingExcel, setIsLoadingExcel] = useState<boolean>(false);

  const {
    findEvidences,
    evidences,
    isLoading,
    isError,
    countEvidence,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useEvidences();

  const router = useRouter();

  const getData = useCallback(() => {
    findEvidences(filters);
  }, [filters, findEvidences]);

  const createPdf = () => {
    if (!filters.manufacturingPlantId) {
      toast.error("Seleccione una planta");
      return;
    }

    if (countEvidence > 500) {
      toast.error("El número máximo de registros para exportar en PDF es 500");
      return;
    }

    setIsLoadingPdf(true);

    EvidencesService.downloadPdf(filters).finally(() => setIsLoadingPdf(false));
  };

  useEffect(() => {
    const parseIds = (value: string | null) =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^\d+$/.test(item));

    const manufacturingPlantId = searchParams.get("manufacturingPlantId") || "";
    const mainTypeIds = parseIds(searchParams.get("mainTypeIds"));
    const areaIds = parseIds(searchParams.get("areaIds"));
    const responsibleIds = parseIds(searchParams.get("responsibleIds"));
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const hasAnyDashboardFilter =
      !!manufacturingPlantId ||
      !!startDate ||
      !!endDate ||
      mainTypeIds.length > 0 ||
      areaIds.length > 0 ||
      responsibleIds.length > 0;

    if (!hasAnyDashboardFilter) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      manufacturingPlantId,
      mainTypeIds,
      areaIds,
      responsibleIds,
      startDate,
      endDate,
      secondaryTypeIds: [],
      zoneIds: [],
      states: [],
      evidenceId: "",
    }));
  }, [searchParams]);

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <>
      <PageHeader title="Hallazgos">
        <Button
          variant="contained"
          startIcon={<AddAPhotoIcon />}
          onClick={() => router.push("/hallazgos/form")}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => {
            setIsLoadingExcel(true);
            EvidencesService.downloadExcel(filters).finally(() =>
              setIsLoadingExcel(false),
            );
          }}
          loading={isLoadingExcel}
        >
          Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => createPdf()}
          loading={isLoadingPdf}
        >
          PDF
        </Button>
      </PageHeader>
      <Grid container>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <FiltersEvidence
            filters={filters}
            setFilters={setFilters}
            count={countEvidence}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          {isLoading ? (
            <TableSkeleton />
          ) : isError ? (
            <ErrorState
              offline={typeof navigator !== "undefined" && !navigator.onLine}
              onRetry={getData}
            />
          ) : (
            <TableEvidences
              rows={evidences}
              getData={getData}
              page={page}
              setPage={setPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              countEvidence={countEvidence}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
