"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { Paper } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";

import { GembaWalkZonesService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";

const GembaWalkZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    nameZone: "",
    nameLocation: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const nameZone = form.nameZone.trim();
    const nameLocation = form.nameLocation.trim();

    if (!manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    if (!nameZone) {
      toast.error("La zona es requerida");
      return;
    }

    if (!nameLocation) {
      toast.error("La ubicación es requerida");
      return;
    }

    setIsLoading(true);

    const payload = { manufacturingPlantId, nameZone, nameLocation };

    if (!idCurrent) {
      GembaWalkZonesService.create(payload)
        .then(() => {
          toast.success("Zona creada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      GembaWalkZonesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Zona actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/gemba-walk/zones");
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.nameZone?.trim() ||
      !form.nameLocation?.trim(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    GembaWalkZonesService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        nameZone: data.nameZone,
        nameLocation: data.nameLocation,
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
          md: 4,
        }}
      >
        <Paper>
          <TextField
            label="Zona"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.nameZone}
            onChange={(e) =>
              setForm({
                ...form,
                nameZone: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 4,
        }}
      >
        <Paper>
          <TextField
            label="Ubicación"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.nameLocation}
            onChange={(e) =>
              setForm({
                ...form,
                nameLocation: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 2.5,
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
          sm: 6,
          md: 2.5,
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

export default GembaWalkZonesFormPage;
