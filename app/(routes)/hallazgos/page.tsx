"use client";

import { useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Toolbar } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { toast } from "sonner";

import TableEvidences from "./_components/TableEvidences";
import LoadingLinear from "@shared/components/LoadingLinear";
import FiltersEvidence, {
  FiltersEvidences,
} from "./_components/FiltersEvidence";
import { useEvidences } from "@hooks";
import { EvidencesService } from "@services";

export default function HallazgosPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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
    <Grid container>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 0, sm: 2 },
            py: 1,
            gap: 1,
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box sx={{ flexGrow: 1, width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              startIcon={<AddAPhotoIcon />}
              onClick={() => router.push("/hallazgos/form")}
              fullWidth={isMobile}
              sx={{ minHeight: 44 }}
            >
              Crear
            </Button>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", sm: "auto" },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "auto auto auto" },
              gap: 1,
              "& .MuiButton-root": {
                minHeight: 44,
                width: { xs: "100%", sm: "auto" },
              },
            }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => getData()}
              aria-label="Refrescar"
            >
              Refrescar
            </Button>
            <Button
              variant="contained"
              startIcon={<SimCardDownloadIcon />}
              onClick={() => {
                setIsLoadingExcel(true);
                EvidencesService.downloadExcel(filters).finally(() =>
                  setIsLoadingExcel(false),
                );
              }}
              loading={isLoadingExcel}
            >
              EXCEL
            </Button>
            <Button
              variant="contained"
              startIcon={<SimCardDownloadIcon />}
              onClick={() => createPdf()}
              loading={isLoadingPdf}
            >
              PDF
            </Button>
          </Box>
        </Toolbar>
      </Grid>
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
          <LoadingLinear />
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
  );
}
