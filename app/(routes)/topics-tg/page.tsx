"use client";

import { useCallback, useEffect, useState } from "react";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import AddIcon from "@mui/icons-material/Add";
import { DialogTitle } from "@mui/material";
import { DialogContent } from "@mui/material";
import { DialogActions } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FormControl } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Select } from "@mui/material";
import { MenuItem } from "@mui/material";
import { toast } from "sonner";

import MultiSelectManufacturingPlants from "@components/MultiSelectManufacturingPlants";
import { BootstrapDialog } from "@routes/hallazgos/_components/CloseEvidence";
import LoadingLinear from "@shared/components/LoadingLinear";
import PageHeader from "@shared/components/PageHeader";
import RefreshButton from "@shared/components/RefreshButton";
import FilterBar from "@shared/components/FilterBar";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import {
  DeleteAction,
  EditAction,
  RowActions,
} from "@shared/components/RowActions";
import TableDefault, {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import { useFieldErrors } from "@hooks/useFieldErrors";
import SelectDefault from "@components/SelectDefault";
import { stringToDateWithTime } from "@shared/utils";
import { useUserSessionStore } from "@store";
import { TopicsService } from "@services";
import { ManufacturingPlant, Topic } from "@interfaces";

export interface IFiltersTopics {
  manufacturingPlantId?: number;
  name?: string;
}

const columns = [
  "ID",
  "Nombre",
  "Duración (hrs)",
  "Tipo de evaluación",
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
    duration: string;
    typeOfEvaluation: string;
    manufacturingPlantNames: string[];
  }>({
    name: "",
    duration: "",
    typeOfEvaluation: "",
    manufacturingPlantNames: [],
  });
  const { fail, errorOf, fieldProps } = useFieldErrors<
    "name" | "duration" | "typeOfEvaluation" | "manufacturingPlantNames"
  >(form);

  const saveData = () => {
    const nameCleaned = form.name.trim();
    const durationCleaned = Number(form.duration.trim() || 0);

    if (!nameCleaned) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (durationCleaned <= 0) {
      fail("duration", "El tiempo de duración debe ser mayor a 0");
      return;
    }

    if (!form.typeOfEvaluation) {
      fail("typeOfEvaluation", "El tipo de evaluación es requerido");
      return;
    }

    if (!form.manufacturingPlantNames.length) {
      fail(
        "manufacturingPlantNames",
        "Debe seleccionar al menos una planta de manufactura",
      );
      return;
    }

    const payload = {
      name: nameCleaned,
      duration: durationCleaned,
      typeOfEvaluation: form.typeOfEvaluation,
      manufacturingPlantsIds: manufacturingPlants
        .filter((mp) => form.manufacturingPlantNames.includes(mp.name))
        .map((mp) => mp.id),
    };

    if (!currentId) {
      TopicsService.create(payload).then(() => {
        toast.success("Tema creado correctamente");
        closeDialog();
      });
    } else {
      TopicsService.update(currentId, payload).then(() => {
        toast.success("Tema actualizado correctamente");
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

    TopicsService.findOne(currentId).then((data) => {
      setForm({
        name: data.name,
        duration: String(data.duration),
        typeOfEvaluation: data.typeOfEvaluation,
        manufacturingPlantNames: data.manufacturingPlants.map((mp) => mp.name),
      });
    });
  }, [currentId]);

  useEffect(() => {
    if (currentId) {
      getData();
    }
  }, [getData, currentId]);

  return (
    <BootstrapDialog
      onClose={() => handleClose(false)}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth={true}
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        {currentId ? "Editar tema" : "Nuevo tema"}
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
            <MultiSelectManufacturingPlants
              values={form.manufacturingPlantNames}
              onChange={(values) => {
                setForm({
                  ...form,
                  manufacturingPlantNames: values,
                });
              }}
            />
            {errorOf("manufacturingPlantNames") && (
              <FormHelperText error>
                {errorOf("manufacturingPlantNames")}
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
              multiline
              rows={4}
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
              {...fieldProps("duration")}
              required
              label="Tiempo de duración"
              variant="outlined"
              fullWidth
              autoComplete="off"
              type="number"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
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
                    duration: e.target.value,
                  });
                }
              }}
              value={form.duration}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <FormControl
              fullWidth
              required
              error={!!errorOf("typeOfEvaluation")}
            >
              <InputLabel id="demo-simple-select-label">
                Tipo de evaluación
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={form.typeOfEvaluation}
                label="Tipo de evaluación *"
                onChange={(event) => {
                  setForm({
                    ...form,
                    typeOfEvaluation: event.target.value,
                  });
                }}
              >
                <MenuItem value="NUMERIC">Numérico</MenuItem>
                <MenuItem value="BOOLEAN">Aprobado / Reprobado</MenuItem>
              </Select>
              {errorOf("typeOfEvaluation") && (
                <FormHelperText>{errorOf("typeOfEvaluation")}</FormHelperText>
              )}
            </FormControl>
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

export default function TopicTg() {
  const [rows, setRows] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  const getData = useDebouncedCallback(() => {
    setIsLoading(true);
    TopicsService.findAll({
      manufacturingPlantId: Number(filters.manufacturingPlantId || 0),
      name: filters.name,
    })
      .then(setRows)
      .finally(() => setIsLoading(false));
  }, 500);

  useEffect(() => {
    getData();
  }, [getData, filters]);

  // Solo se lee la lista de plantas para no re-renderizar con cada cambio de
  // la sesión.
  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const confirmRemove = async (row: Topic) => {
    const confirmed = await confirm({
      title: "Confirmar eliminación",
      description: `¿Está seguro de eliminar el tema "${row.name}"?`,
      confirmLabel: "Confirmar",
      tone: "danger",
    });

    if (!confirmed) return;

    TopicsService.remove(row.id).then(() => {
      toast.success("Tema eliminado correctamente");
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
      <PageHeader title="Temas - Guías de entrenamiento">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsOpen(true)}
        >
          Crear
        </Button>
        <RefreshButton onClick={() => getData()} />
      </PageHeader>
      <FilterBar count={rows.length}>
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
        <TableDefault
          rows={rows}
          columns={columns}
          ariaLabel="Temas de guías de entrenamiento"
          paintRows={(row) => (
            <StyledTableRow key={row.name}>
              <StyledTableCell component="th" scope="row">
                {row.id}
              </StyledTableCell>
              <StyledTableCell>{row.name}</StyledTableCell>
              <StyledTableCell>{row.duration}</StyledTableCell>
              <StyledTableCell>{row.typeOfEvaluation}</StyledTableCell>
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
