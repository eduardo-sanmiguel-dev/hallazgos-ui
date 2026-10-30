"use client";

import { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";

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

  // Hallazgo a abrir al cargar (?evidenceId=, el botón "Ver hallazgo" de
  // los correos). En la página: sobrevive a que la tabla se vuelva a montar
  // mientras carga; se olvida al cerrar su detalle.
  const [linkedEvidenceId, setLinkedEvidenceId] = useState(0);

  const {
    refresh: getData,
    evidences,
    isLoading,
    isError,
    countEvidence,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useEvidences(filters);

  const router = useRouter();

  const downloadExcel = useMutation({
    mutationFn: EvidencesService.downloadExcel,
  });
  const downloadPdf = useMutation({ mutationFn: EvidencesService.downloadPdf });

  const createPdf = () => {
    if (!filters.manufacturingPlantId) {
      toast.error("Seleccione una planta");
      return;
    }

    if (countEvidence > 500) {
      toast.error("El número máximo de registros para exportar en PDF es 500");
      return;
    }

    downloadPdf.mutate(filters);
  };

  useEffect(() => {
    const parseIds = (value: string | null) =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => /^\d+$/.test(item));

    // Enlace a un hallazgo: la lista solo con él y su detalle abierto.
    const evidenceId = searchParams.get("evidenceId") || "";
    if (/^\d+$/.test(evidenceId)) {
      setFilters((prev) => ({
        ...prev,
        evidenceId,
        manufacturingPlantId: "",
        mainTypeIds: [],
        secondaryTypeIds: [],
        areaIds: [],
        zoneIds: [],
        responsibleIds: [],
        states: [],
        startDate: "",
        endDate: "",
      }));
      setLinkedEvidenceId(Number(evidenceId));
      return;
    }

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
          onClick={() => downloadExcel.mutate(filters)}
          loading={downloadExcel.isPending}
        >
          Excel
        </Button>
        <Button
          variant="outlined"
          startIcon={<SimCardDownloadIcon />}
          onClick={() => createPdf()}
          loading={downloadPdf.isPending}
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
              openEvidenceId={linkedEvidenceId}
              onCloseLinkedEvidence={() => setLinkedEvidenceId(0)}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
