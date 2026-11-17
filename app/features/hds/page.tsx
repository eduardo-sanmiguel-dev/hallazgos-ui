import { ChangeEvent, useRef, useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { Grid } from "@mui/material";
import { LinearProgress } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { usePaginatedList, useTableSort, useUploadProgress } from "@hooks";
import { useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { notify } from "@shared/utils";
import { formatFileSize } from "@shared/utils/evidenceImage";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar, { compactFilters } from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { DeleteAction, EditAction, RowActions, ViewAction } from "@shared/components/RowActions";
import ResponsiveTable, { type ResponsiveColumn } from "@shared/components/ResponsiveTable";
import { HdsService } from "@services";
import { Hds } from "@interfaces";
import type { SortOption, SortState } from "@shared/utils";

export interface IFiltersHds {
  name?: string;
}

const DEFAULT_FILTERS_HDS: IFiltersHds = {
  name: "",
};

// Solo hay una columna: el orden (A → Z / Z → A) se elige en el encabezado o
// en la barra de filtros, como en las demás tablas (antes era un filtro).
const HDS_SORT_OPTIONS: SortOption[] = [{ key: "name", label: "Nombre", kind: "text" }];
const HDS_DEFAULT_SORT: SortState = { orderBy: "name", order: "asc" };

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Hds>[] = [
  {
    id: "name",
    sortKey: "name",
    header: "Nombre",
    cell: (row) => row.name,
    rowHeader: true,
    card: "title",
  },
];

// Mismo límite que el API (algunas HDS escaneadas pesan más de 20 MB).
export const HDS_MAX_BYTES = 30 * 1024 * 1024;

/** Motivo por el que el archivo no se puede subir; vacío si está bien. */
export const hdsFileError = (file: File) => {
  if (!/\.pdf$/i.test(file.name)) return "Solo se permiten archivos PDF.";
  if (file.size > HDS_MAX_BYTES)
    return `El PDF pesa ${formatFileSize(file.size)}; el máximo es 30 MB.`;
  return "";
};

const HdsPage = () => {
  const [filters, setFilters] = useState<IFiltersHds>(DEFAULT_FILTERS_HDS);
  const isAdmin = useUserSessionStore((state) => state.role) === ROLE_ADMINISTRADOR;
  const { confirm, confirmDialog } = useConfirmDialog();
  const progress = useUploadProgress();
  // Un solo selector de archivos: para subir una HDS nueva (null) o para
  // reemplazar el PDF de la fila elegida.
  const fileInput = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<Hds | null>(null);
  const [uploadingName, setUploadingName] = useState("");
  // Una a la vez: el botón se deshabilita mientras se descarga.
  const download = useMutation({
    mutationFn: (name: string) => HdsService.downloadFile(name),
  });

  const sort = useTableSort("hds", HDS_SORT_OPTIONS, HDS_DEFAULT_SORT);

  const uploadMutation = useMutation({
    mutationFn: ({ file, target }: { file: File; target: Hds | null }) =>
      target
        ? HdsService.replace(target.id, file, { onUploadProgress: progress.onUploadProgress })
        : HdsService.upload(file, { onUploadProgress: progress.onUploadProgress }),
    onSuccess: (hds, { target }) => {
      notify(target ? `Se reemplazó el PDF de "${hds.name}".` : `Se subió "${hds.name}".`, true);
      void getData();
    },
    onSettled: () => {
      progress.reset();
      setUploadingName("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (row: Hds) => HdsService.remove(row.id),
    onSuccess: ({ name }) => {
      notify(`Se eliminó "${name}".`, true);
      void getData();
    },
  });

  const pickFile = (target: Hds | null) => {
    setReplaceTarget(target);
    fileInput.current?.click();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo.
    event.target.value = "";
    if (!file) return;
    const error = hdsFileError(file);
    if (error) {
      notify(error);
      return;
    }
    setUploadingName(replaceTarget ? replaceTarget.name : file.name);
    uploadMutation.mutate({ file, target: replaceTarget });
  };

  const confirmRemove = (row: Hds) =>
    confirm({
      title: "¿Eliminar hoja de datos?",
      description: `Se quitará "${row.name}" del catálogo y se borrará su PDF. No se puede deshacer.`,
      confirmLabel: "Eliminar",
      tone: "danger",
      action: () => removeMutation.mutateAsync(row),
    });

  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  const {
    rows: data,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "hds",
    filters,
    sort: sort.sort,
    fetcher: (filters, params) => HdsService.findAllPaginated({ ...filters, ...params }),
  });

  return (
    <>
      <PageHeader title="Hoja de datos de seguridad">
        <RefreshButton onClick={() => getData()} />
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => pickFile(null)}
            disabled={isBusy}
          >
            Subir HDS
          </Button>
        )}
      </PageHeader>
      {isAdmin && (
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          data-testid="hds-file-input"
          onChange={handleFile}
        />
      )}
      {uploadingName && (
        <Box component="output" sx={{ display: "block", mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Subiendo "{uploadingName}"
            {progress.progress !== null && ` · ${Math.round(progress.progress)} %`}
          </Typography>
          <LinearProgress
            variant={progress.progress ? "determinate" : "indeterminate"}
            value={progress.progress ?? 0}
            aria-label={`Subiendo ${uploadingName}`}
          />
        </Box>
      )}
      <FilterBar
        sort={sort}
        count={count}
        activeFilters={compactFilters(
          !!filters.name && {
            key: "name",
            label: "Nombre",
            value: filters.name,
            onRemove: () => setFilters({ ...filters, name: "" }),
          },
        )}
        onClearAll={() => setFilters(DEFAULT_FILTERS_HDS)}
      >
        <ClearFiltersButton
          visible={!!filters.name}
          onClick={() => setFilters(DEFAULT_FILTERS_HDS)}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <TextField
            label="Nombre"
            fullWidth
            variant="outlined"
            value={filters.name}
            autoComplete="off"
            onChange={(e) => {
              setFilters({
                ...filters,
                name: e.target.value,
              });
            }}
          />
        </Grid>
      </FilterBar>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <ResponsiveTable
          sorting={sort}
          rows={data}
          columns={columns}
          getRowKey={(row) => row.name}
          pagination={pagination}
          ariaLabel="Hojas de datos de seguridad"
          emptyTitle="Sin registros de hojas de datos"
          emptyDescription="No hay hojas de datos con los filtros actuales."
          actions={(row) => (
            <RowActions>
              <ViewAction
                label="Ver archivo"
                onClick={() => download.mutate(row.name)}
                disabled={download.isPending}
              />
              {isAdmin && (
                <>
                  <EditAction
                    label="Reemplazar PDF"
                    onClick={() => pickFile(row)}
                    disabled={isBusy}
                  />
                  <DeleteAction onClick={() => confirmRemove(row)} disabled={isBusy} />
                </>
              )}
            </RowActions>
          )}
        />
      )}
      {confirmDialog}
    </>
  );
};

export default HdsPage;
