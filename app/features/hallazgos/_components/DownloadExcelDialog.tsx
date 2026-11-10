import { useId, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import SimCardDownloadIcon from "@mui/icons-material/SimCardDownload";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";

import { useUserSessionStore } from "@store";
import { EvidencesService } from "@services";
import SelectDefault from "@components/SelectDefault";
import {
  EXPORT_MAX_MONTHS,
  exportPeriodError,
  initialExportPeriod,
  initialExportPlant,
  parseDdMmYyyy,
  type ExportPeriod,
} from "@shared/utils/exportPeriod";
import { FiltersEvidences } from "./FiltersEvidence";

interface Props {
  /** Filtros de la lista: se aplican también al Excel. */
  filters: FiltersEvidences;
  onClose: () => void;
}

const ALL_PLANTS = "";
const toDayjs = (value: string): Dayjs | null => {
  const date = parseDdMmYyyy(value);
  return date ? dayjs(date) : null;
};

/**
 * Descarga del Excel de hallazgos con planta y período explícitos. Antes se
 * exportaba todo el histórico de todas las plantas si la lista no tenía
 * filtros; ahora se proponen los últimos 90 días (hasta 12 meses por
 * descarga, la API también lo valida) y se muestra cuántos registros saldrán.
 */
export default function DownloadExcelDialog({ filters, onClose }: Props) {
  const titleId = useId();
  const plants = useUserSessionStore((state) => state.manufacturingPlants);
  const [plantId, setPlantId] = useState(() =>
    initialExportPlant(filters.manufacturingPlantId, plants),
  );
  const [period, setPeriod] = useState<ExportPeriod>(() => initialExportPeriod(filters));
  const periodError = exportPeriodError(period);

  // Zonas, lugares y responsables dependen de la planta de la lista.
  const samePlant = plantId === filters.manufacturingPlantId;
  const dropsPlantFilters =
    !samePlant &&
    filters.areaIds.length + filters.zoneIds.length + filters.responsibleIds.length > 0;
  const exportFilters: FiltersEvidences = {
    ...filters,
    ...period,
    manufacturingPlantId: plantId,
    ...(!samePlant && { areaIds: [], zoneIds: [], responsibleIds: [] }),
  };
  const otherFilters =
    !!filters.evidenceId ||
    filters.mainTypeIds.length > 0 ||
    filters.secondaryTypeIds.length > 0 ||
    filters.states.length > 0 ||
    (samePlant &&
      filters.areaIds.length + filters.zoneIds.length + filters.responsibleIds.length > 0);

  // El total sale de la lista paginada con los mismos filtros (1 registro).
  const count = useQuery({
    queryKey: ["list", "evidences", "export-count", exportFilters],
    queryFn: () => EvidencesService.findPaginated(exportFilters, { page: 1, limit: 1 }),
    select: (data) => data.count,
    enabled: !periodError,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const download = useMutation({
    mutationFn: EvidencesService.downloadExcel,
    onSuccess: onClose,
  });

  const total = periodError ? undefined : count.data;
  const canDownload = !periodError && !!total && !download.isPending;
  const setDate = (key: keyof ExportPeriod) => (value: Dayjs | null) =>
    setPeriod((current) => ({
      ...current,
      [key]: value?.isValid() ? value.format("DD/MM/YYYY") : "",
    }));

  return (
    <Dialog
      open
      onClose={() => {
        if (!download.isPending) onClose();
      }}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>Descargar Excel de hallazgos</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
          {plants.length > 1 ? (
            <SelectDefault
              label="Planta"
              name="exportPlantId"
              data={[{ id: ALL_PLANTS, name: "Todas mis plantas" }, ...plants]}
              value={plantId}
              onChange={(event) => setPlantId(event.target.value || ALL_PLANTS)}
              disabled={download.isPending}
            />
          ) : (
            <Typography variant="body2">
              Planta: <strong>{plants[0]?.name ?? "Sin planta asignada"}</strong>
            </Typography>
          )}

          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="es"
            localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText}
          >
            <Box
              sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}
            >
              <DatePicker
                label="Fecha inicio"
                format="DD/MM/YYYY"
                value={toDayjs(period.startDate)}
                maxDate={toDayjs(period.endDate) || dayjs()}
                onChange={setDate("startDate")}
                disabled={download.isPending}
                slotProps={{ textField: { fullWidth: true, name: "exportStartDate" } }}
              />
              <DatePicker
                label="Fecha fin"
                format="DD/MM/YYYY"
                value={toDayjs(period.endDate)}
                minDate={toDayjs(period.startDate) || undefined}
                maxDate={dayjs()}
                onChange={setDate("endDate")}
                disabled={download.isPending}
                slotProps={{ textField: { fullWidth: true, name: "exportEndDate" } }}
              />
            </Box>
          </LocalizationProvider>

          <Typography variant="caption" color={periodError ? "error" : "text.secondary"}>
            {periodError ??
              `Hasta ${EXPORT_MAX_MONTHS} meses por descarga. Para un período más largo, descárguelo por partes.`}
          </Typography>

          {(otherFilters || dropsPlantFilters) && (
            <Typography variant="body2" color="text.secondary">
              {otherFilters && "También se aplican los demás filtros de la lista. "}
              {dropsPlantFilters &&
                "Con otra planta no se aplican las zonas, lugares ni responsables elegidos en la lista."}
            </Typography>
          )}

          <Box component="output" aria-live="polite" sx={{ display: "block" }}>
            {periodError ? null : count.isError ? (
              <Alert severity="warning">No se pudo contar los registros. Intente de nuevo.</Alert>
            ) : total === undefined ? (
              <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} /> Contando hallazgos…
              </Typography>
            ) : total === 0 ? (
              <Alert severity="info">No hay hallazgos con esta planta, período y filtros.</Alert>
            ) : (
              <Typography variant="body2">
                Se exportarán <strong>{total.toLocaleString("es-MX")}</strong>{" "}
                {total === 1 ? "hallazgo" : "hallazgos"}.
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={download.isPending}>
          Cancelar
        </Button>
        <Button
          data-dd-action-name="Descargar Excel de hallazgos"
          variant="contained"
          startIcon={<SimCardDownloadIcon />}
          disabled={!canDownload && !download.isPending}
          loading={download.isPending}
          onClick={() => download.mutate(exportFilters)}
        >
          Descargar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
