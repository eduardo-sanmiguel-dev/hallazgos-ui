"use client";

import { useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { IconButton } from "@mui/material";
import { InputAdornment } from "@mui/material";
import { Skeleton } from "@mui/material";
import { Stack } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { toast } from "sonner";

import { BootstrapDialog } from "@routes/hallazgos/_components/CloseEvidence";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { usePaginatedList } from "@hooks";
import { TableSkeleton } from "@shared/components/Skeletons";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar, {
  compactFilters,
  optionLabel,
} from "@shared/components/FilterBar";
import ClearFiltersButton from "@shared/components/ClearFiltersButton";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import ResponsiveTable, {
  type ResponsiveColumn,
} from "@shared/components/ResponsiveTable";
import FormActions from "@shared/components/FormActions";
import EmptyState from "@shared/components/EmptyState";
import ErrorState from "@shared/components/ErrorState";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import {
  DECIMAL_INPUT,
  NUMERIC_INPUT,
  toDecimal,
  toPositiveInteger,
} from "@shared/utils/inputModes";
import { Equipment, ManufacturingPlant } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { stringToDateWithTime, updatedDateLabel } from "@shared/utils";
import { useUserSessionStore } from "@store";
import { EquipmentsService } from "@services";

export interface IFiltersTopics {
  manufacturingPlantId?: number;
  name?: string;
}

// Tabla en tablet y escritorio; tarjetas en celular (ResponsiveTable).
const columns: ResponsiveColumn<Equipment>[] = [
  {
    id: "id",
    header: "ID",
    cell: (row) => row.id,
    rowHeader: true,
    card: "hidden",
  },
  { id: "name", header: "Nombre", cell: (row) => row.name, card: "title" },
  {
    id: "manufacturingPlantCard",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "subtitle",
    hideInTable: true,
  },
  {
    id: "deliveryFrequency",
    header: "Frecuencia de entrega (días)",
    cell: (row) => row.deliveryFrequency,
  },
  {
    id: "price",
    header: "Precio",
    cell: (row) =>
      row.costHistory.length ? `$ ${row.costHistory[0].price}` : "",
  },
  {
    id: "manufacturingPlant",
    header: "Planta",
    cell: (row) => row.manufacturingPlant.name,
    card: "hidden",
  },
  {
    id: "createdAt",
    header: "Fecha de creación",
    cell: (row) => stringToDateWithTime(row.createdAt),
    card: "hidden",
  },
  {
    id: "createdBy",
    header: "Creado por",
    cell: (row) => row.createdBy.name,
    card: "hidden",
  },
  {
    id: "updatedAt",
    header: "Fecha de actualización",
    cell: (row) => updatedDateLabel(row.createdAt, row.updatedAt) ?? "-",
  },
  {
    id: "updatedBy",
    header: "Actualizado por",
    cell: (row) => row.updatedBy?.name,
    card: "hidden",
  },
];

const EMPTY_FORM = {
  name: "",
  deliveryFrequency: "",
  manufacturingPlantId: "",
  price: "",
};

const ScreenForm = ({
  currentId,
  closeDialog,
  manufacturingPlants,
}: {
  currentId: number;
  closeDialog: () => void;
  manufacturingPlants: ManufacturingPlant[];
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // A pantalla completa en celular, como los demás formularios en diálogo.
  const isPhone = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  // Con una sola planta se elige sola: al crear no cuenta como captura.
  const leave = useLeaveConfirm(form, {
    isEditing: !!currentId,
    ignoreOnCreate: ["manufacturingPlantId"],
  });

  const record = useEditRecord(currentId, EquipmentsService.findOne, (data) => {
    const loaded = {
      name: data.name,
      deliveryFrequency: data?.deliveryFrequency
        ? String(data.deliveryFrequency)
        : "",
      manufacturingPlantId: String(data.manufacturingPlant.id),
      price: data?.costHistory.length ? String(data.costHistory[0].price) : "",
    };
    setForm(loaded);
    leave.markPristine(loaded);
  });

  const saveData = () => {
    const nameCleaned = form.name.trim();
    const deliveryFrequencyCleaned = Number(form.deliveryFrequency.trim() || 0);
    const priceCleaned = Number(form.price.trim() || 0);

    // Todo lo que falta, en el orden de la pantalla.
    if (
      failAll({
        manufacturingPlantId: !form.manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        name: !nameCleaned ? "Escribe el nombre." : undefined,
      })
    ) {
      return;
    }

    const payload = {
      name: nameCleaned,
      deliveryFrequency:
        deliveryFrequencyCleaned > 0 ? deliveryFrequencyCleaned : null,
      manufacturingPlantId: Number(form.manufacturingPlantId),
      price: priceCleaned > 0 ? priceCleaned : null,
    };

    setIsSaving(true);
    const request = !currentId
      ? EquipmentsService.create(payload).then(() => {
          toast.success("Equipo creado correctamente");
          closeDialog();
        })
      : EquipmentsService.update(currentId, payload).then(() => {
          toast.success("Equipo actualizado correctamente");
          closeDialog();
        });
    request.catch(failFromApi).finally(() => setIsSaving(false));
  };

  // X, Esc, clic afuera y "Cancelar": con algo capturado, pregunta antes.
  const requestClose = async () => {
    if (isSaving) return;
    if (await leave.confirmDiscard()) closeDialog();
  };

  useEffect(() => {
    if (!currentId && manufacturingPlants.length === 1) {
      setForm((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants, currentId]);

  const title = currentId ? "Editar equipo" : "Nuevo equipo";
  const isPending = isEditRecordPending(record.status);

  return (
    <BootstrapDialog
      onClose={requestClose}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth={true}
      fullScreen={isPhone}
    >
      <DialogTitle sx={{ m: 0, p: 2, pr: 7 }} id="customized-dialog-title">
        {title}
      </DialogTitle>
      <IconButton
        aria-label="Cerrar"
        onClick={requestClose}
        sx={{
          position: "absolute",
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        {record.status === "loading" ? (
          <Stack spacing={2} role="status" aria-label="Cargando…">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} variant="rounded" height={56} />
            ))}
          </Stack>
        ) : record.status === "notFound" ? (
          <EmptyState
            icon={<SearchOffIcon />}
            title="Equipo no encontrado"
            description="Puede que se haya eliminado."
          />
        ) : record.status === "error" ? (
          <ErrorState
            offline={typeof navigator !== "undefined" && !navigator.onLine}
            onRetry={record.retry}
          />
        ) : (
          <Grid container spacing={2}>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <SelectManufacturingPlants
                value={form.manufacturingPlantId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manufacturingPlantId: e.target.value,
                  })
                }
              />
              {errorOf("manufacturingPlantId") && (
                <FormHelperText data-error-for="manufacturingPlantId" error>
                  {errorOf("manufacturingPlantId")}
                </FormHelperText>
              )}
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <TextField
                {...fieldProps("name")}
                required
                label="Nombre"
                variant="outlined"
                fullWidth
                autoComplete="off"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <TextField
                {...fieldProps("deliveryFrequency")}
                label="Frecuencia de entrega (días)"
                variant="outlined"
                fullWidth
                autoComplete="off"
                // Teclado numérico (B1); antes type="number" con teclas
                // bloqueadas.
                slotProps={{ htmlInput: NUMERIC_INPUT }}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deliveryFrequency: toPositiveInteger(e.target.value),
                  })
                }
                value={form.deliveryFrequency}
              />
            </Grid>
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 12,
              }}
            >
              <TextField
                {...fieldProps("price")}
                label="Precio"
                variant="outlined"
                fullWidth
                autoComplete="off"
                // Teclado numérico con punto (B1).
                slotProps={{
                  htmlInput: DECIMAL_INPUT,
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  },
                }}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: toDecimal(e.target.value),
                  })
                }
                value={form.price}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      {/* FormActions a todo el ancho (en celular, botones apilados). */}
      <DialogActions sx={{ p: 2, "& > *": { flex: 1 } }}>
        <FormActions
          onCancel={requestClose}
          onSave={saveData}
          isSaving={isSaving}
          isSaveDisabled={isPending}
        />
      </DialogActions>
      {leave.confirmDialog}
    </BootstrapDialog>
  );
};

export default function EquipmentsPage() {
  const [currentId, setCurrentId] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [filters, setFilters] = useState<{
    name: string;
    manufacturingPlantId: string;
  }>({
    manufacturingPlantId: "",
    name: "",
  });

  const { confirm, confirmDialog } = useConfirmDialog();

  const {
    rows: rows,
    count,
    pagination,
    isLoading,
    refresh: getData,
  } = usePaginatedList({
    key: "equipments",
    filters,
    fetcher: (filters, { page, limit }) =>
      EquipmentsService.findAllPaginated({
        page,
        limit,
        manufacturingPlantId: filters.manufacturingPlantId,
        name: filters.name,
      }),
  });

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  useEffect(() => {
    if (manufacturingPlants.length === 1) {
      setFilters((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants]);

  const confirmRemove = async (row: Equipment) => {
    await confirm({
      title: "Confirmar eliminación",
      description: `¿Está seguro de eliminar el equipo "${row.name}"?`,
      confirmLabel: "Confirmar",
      tone: "danger",
      action: () =>
        EquipmentsService.remove(row.id).then(() => {
          toast.success("Equipo eliminado correctamente");
          getData();
        }),
    });
  };

  return (
    <>
      {isOpen && (
        <ScreenForm
          manufacturingPlants={manufacturingPlants}
          currentId={currentId}
          closeDialog={() => {
            setIsOpen(false);
            setCurrentId(0);
            getData();
          }}
        />
      )}
      {confirmDialog}
      <PageHeader title="Equipo de protección personal">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsOpen(true)}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar
        count={count}
        activeFilters={compactFilters(
          !!filters.manufacturingPlantId && {
            key: "manufacturingPlantId",
            label: "Planta",
            value: optionLabel(
              filters.manufacturingPlantId,
              manufacturingPlants,
            ),
            onRemove: () =>
              setFilters({ ...filters, manufacturingPlantId: "" }),
          },
          !!filters.name && {
            key: "name",
            label: "Nombre",
            value: filters.name,
            onRemove: () => setFilters({ ...filters, name: "" }),
          },
        )}
        onClearAll={() => setFilters({ manufacturingPlantId: "", name: "" })}
      >
        <ClearFiltersButton
          visible={!!filters.name || !!filters.manufacturingPlantId}
          onClick={() => setFilters({ manufacturingPlantId: "", name: "" })}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            isFilter={true}
            value={filters.manufacturingPlantId}
            onChange={(e) => {
              setFilters({
                ...filters,
                manufacturingPlantId: e.target.value,
              });
            }}
          />
        </Grid>
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
          rows={rows}
          columns={columns}
          getRowKey={(row) => row.id}
          pagination={pagination}
          ariaLabel="Equipos de protección personal"
          emptyTitle="Sin registros de equipos"
          emptyDescription="No hay equipos con los filtros actuales."
          actions={(row) => (
            <RowActions>
              <EditAction
                onClick={() => {
                  setIsOpen(true);
                  setCurrentId(row.id);
                }}
              />
              <DeleteAction onClick={() => confirmRemove(row)} />
            </RowActions>
          )}
        />
      )}
    </>
  );
}
