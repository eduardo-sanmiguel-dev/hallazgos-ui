"use client";

import { useCallback, useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";

import { BootstrapDialog } from "@routes/hallazgos/_components/CloseEvidence";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { usePaginatedList } from "@hooks";
import LoadingLinear from "@shared/components/LoadingLinear";
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
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import TableDefaultServer from "@shared/components/TableDefaultServer";
import { useFieldErrors } from "@hooks/useFieldErrors";
import { Equipment, ManufacturingPlant } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { stringToDateWithTime } from "@shared/utils";
import { useUserSessionStore } from "@store";
import { EquipmentsService } from "@services";

export interface IFiltersTopics {
  manufacturingPlantId?: number;
  name?: string;
}

const columns = [
  "ID",
  "Nombre",
  "Frecuencia de entrega (dias)",
  "Precio",
  "Planta",
  "Fecha de creación",
  "Creado por",
  "Fecha de actualización",
  "Actualizado por",
  "Acciones",
];

const ScreenForm = ({
  currentId,
  closeDialog,
  manufacturingPlants,
}: {
  currentId: number;
  closeDialog: () => void;
  manufacturingPlants: ManufacturingPlant[];
}) => {
  const [form, setForm] = useState<{
    name: string;
    deliveryFrequency: string;
    manufacturingPlantId: string;
    price: string;
  }>({
    name: "",
    deliveryFrequency: "",
    manufacturingPlantId: "",
    price: "",
  });
  const { fail, errorOf, fieldProps } = useFieldErrors<
    "name" | "manufacturingPlantId"
  >(form);

  const saveData = () => {
    const nameCleaned = form.name.trim();
    const deliveryFrequencyCleaned = Number(form.deliveryFrequency.trim() || 0);
    const priceCleaned = Number(form.price.trim() || 0);

    if (!nameCleaned) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!form.manufacturingPlantId) {
      fail(
        "manufacturingPlantId",
        "Debe seleccionar una planta de manufactura.",
      );
      return;
    }

    const payload = {
      name: nameCleaned,
      deliveryFrequency:
        deliveryFrequencyCleaned > 0 ? deliveryFrequencyCleaned : null,
      manufacturingPlantId: Number(form.manufacturingPlantId),
      price: priceCleaned > 0 ? priceCleaned : null,
    };

    if (!currentId) {
      EquipmentsService.create(payload).then(() => {
        toast.success("Equipo creado correctamente");
        closeDialog();
      });
    } else {
      EquipmentsService.update(currentId, payload).then(() => {
        toast.success("Equipo actualizado correctamente");
        closeDialog();
      });
    }
  };

  const handleClose = (shouldSave: boolean) => {
    if (!shouldSave) {
      closeDialog();
      return;
    }

    saveData();
  };

  const getData = useCallback(() => {
    if (!currentId) return;

    EquipmentsService.findOne(currentId).then((data) => {
      setForm({
        name: data.name,
        deliveryFrequency: data?.deliveryFrequency
          ? String(data.deliveryFrequency)
          : "",
        manufacturingPlantId: String(data.manufacturingPlant.id),
        price: data?.costHistory.length
          ? String(data.costHistory[0].price)
          : "",
      });
    });
  }, [currentId]);

  useEffect(() => {
    if (currentId) {
      getData();
    }
  }, [getData, currentId]);

  useEffect(() => {
    if (!currentId && manufacturingPlants.length === 1) {
      setForm((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants, currentId]);

  return (
    <BootstrapDialog
      onClose={() => handleClose(false)}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth={true}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        {currentId ? "Editar equipo" : "Nuevo equipo"}
      </DialogTitle>
      <IconButton
        aria-label="Cerrar"
        onClick={() => handleClose(false)}
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
              label="Frecuencia de entrega (dias)"
              variant="outlined"
              fullWidth
              autoComplete="off"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 0 } }}
              onKeyDown={(evt) => {
                const forbidden = ["e", "E", "-", "+", "."];
                if (forbidden.includes(evt.key)) evt.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                const num = Number(val);
                if (val === "" || (!Number.isNaN(num) && num > 0)) {
                  setForm({
                    ...form,
                    deliveryFrequency: e.target.value,
                  });
                }
              }}
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
              label="Precio"
              variant="outlined"
              fullWidth
              autoComplete="off"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 0.01 } }}
              onKeyDown={(evt) => {
                const forbidden = ["e", "E", "-", "+"];
                if (forbidden.includes(evt.key)) evt.preventDefault();
              }}
              onChange={(e) => {
                const val = e.target.value;
                const num = Number(val);

                if (val === "" || (!Number.isNaN(num) && num > 0)) {
                  const rounded = Math.round(num * 100) / 100;
                  setForm({
                    ...form,
                    price: rounded.toString(),
                  });
                }
              }}
              value={form.price}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)} variant="text">
          Cancelar
        </Button>
        <Button onClick={() => handleClose(true)} variant="contained">
          Guardar
        </Button>
      </DialogActions>
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
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      description: `¿Está seguro de eliminar el equipo "${row.name}"?`,
      confirmLabel: "Confirmar",
      tone: "danger",
    });

    if (!confirmed) return;

    EquipmentsService.remove(row.id).then(() => {
      toast.success("Equipo eliminado correctamente");
      getData();
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
        <LoadingLinear />
      ) : (
        <TableDefaultServer
          rows={rows}
          columns={columns}
          {...pagination}
          ariaLabel="Equipos de protección personal"
          paintRows={(row) => (
            <StyledTableRow key={row.name}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.name}</StyledTableCell>
              <StyledTableCell>{row.deliveryFrequency}</StyledTableCell>
              <StyledTableCell>
                {row.costHistory.length ? `$ ${row.costHistory[0].price}` : ""}
              </StyledTableCell>
              <StyledTableCell>{row.manufacturingPlant.name}</StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(row.createdAt)}
              </StyledTableCell>
              <StyledTableCell>{row.createdBy.name}</StyledTableCell>
              <StyledTableCell>
                {stringToDateWithTime(row.updatedAt)}
              </StyledTableCell>
              <StyledTableCell>{row.updatedBy?.name}</StyledTableCell>
              <StyledTableCell>
                <RowActions>
                  <EditAction
                    onClick={() => {
                      setIsOpen(true);
                      setCurrentId(row.id);
                    }}
                  />
                  <DeleteAction onClick={() => confirmRemove(row)} />
                </RowActions>
              </StyledTableCell>
            </StyledTableRow>
          )}
        />
      )}
    </>
  );
}
