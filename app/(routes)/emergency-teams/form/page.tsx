"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import SaveIcon from "@mui/icons-material/Save";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import MenuItem from "@mui/material/MenuItem";
import { toast } from "sonner";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { EmergencyTeamsService } from "@services";
import { ExtinguisherType } from "@interfaces";

const extinguisherTypes = [
  ExtinguisherType.PQS,
  ExtinguisherType.CO2,
  ExtinguisherType.AFFF,
];

const EmergencyTeamsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    location: "",
    extinguisherNumber: "",
    typeOfExtinguisher: "" as ExtinguisherType | "",
    capacity: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const save = () => {
    const locationClean = form.location.trim();
    const extinguisherNumberClean = form.extinguisherNumber.trim();
    const capacityClean = form.capacity.trim();

    if (!form.manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    if (!locationClean) {
      toast.error("La ubicación es requerida");
      return;
    }

    if (!extinguisherNumberClean) {
      toast.error("El número de extintor es requerido");
      return;
    }

    if (!capacityClean) {
      toast.error("La capacidad es requerida");
      return;
    }

    if (!form.typeOfExtinguisher) {
      toast.error("El tipo de extintor es requerido");
      return;
    }

    setIsLoading(true);

    const payload = {
      location: locationClean,
      extinguisherNumber: Number(extinguisherNumberClean),
      typeOfExtinguisher: form.typeOfExtinguisher as ExtinguisherType,
      capacity: Number(capacityClean),
      manufacturingPlantId: Number(form.manufacturingPlantId),
    };

    if (!idCurrent) {
      EmergencyTeamsService.create(payload)
        .then(() => {
          toast.success("Equipo de emergencia creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      EmergencyTeamsService.update(idCurrent, payload)
        .then(() => {
          toast.success("Equipo de emergencia actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/emergency-teams");
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.location?.trim() ||
      !form.extinguisherNumber?.trim() ||
      !form.typeOfExtinguisher ||
      !form.capacity?.trim(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    EmergencyTeamsService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: data.manufacturingPlant?.id?.toString() || "",
        location: data.location,
        extinguisherNumber: data.extinguisherNumber.toString(),
        typeOfExtinguisher: data.typeOfExtinguisher,
        capacity: data.capacity.toString(),
      });
    });
  }, [searchParams]);

  return (
    <Grid container spacing={2}>
      <SelectManufacturingPlantsOwn
        value={form.manufacturingPlantId}
        onChange={(e) =>
          setForm({
            ...form,
            manufacturingPlantId: e.target.value,
          })
        }
      />
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
          <TextField
            label="Ubicación"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.location}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                location: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
          <TextField
            type="number"
            onKeyDown={(evt) => {
              const forbidden = ["e", "E", "-", "+", "."];
              if (forbidden.includes(evt.key)) evt.preventDefault();
            }}
            label="N. Extintor"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.extinguisherNumber}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                extinguisherNumber: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
          <TextField
            select
            label="Tipo de extintor"
            variant="outlined"
            fullWidth
            value={form.typeOfExtinguisher}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                typeOfExtinguisher: e.target.value as ExtinguisherType | "",
              })
            }
          >
            <MenuItem value="">Seleccione</MenuItem>
            {extinguisherTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3,
        }}
      >
        <Paper>
          <TextField
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Capacidad"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.capacity}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                capacity: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 3,
          md: 3,
        }}
      >
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<CloseIcon />}
          onClick={cancel}
        >
          Cancelar
        </Button>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 3,
          md: 3,
        }}
      >
        <Button
          loading={isLoading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
          color="primary"
          fullWidth
          onClick={save}
          disabled={isValidateForm || isLoading}
        >
          Guardar
        </Button>
      </Grid>
    </Grid>
  );
};

export default EmergencyTeamsFormPage;

