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

import { ManufacturingPlantsService } from "@services";

const ManufacturingPlantsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    link: "",
    lat: "",
    lng: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const save = () => {
    const nameClean = form.name.trim();
    const linkClean = form.link.trim();
    const latClean = form.lat.trim();
    const lngClean = form.lng.trim();

    if (!nameClean) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!linkClean) {
      toast.error("El link es requerido");
      return;
    }

    if (!latClean) {
      toast.error("La latitud es requerida");
      return;
    }

    if (!lngClean) {
      toast.error("La longitud es requerida");
      return;
    }

    setIsLoading(true);

    if (!idCurrent) {
      ManufacturingPlantsService.create({
        name: nameClean,
        link: linkClean,
        lat: Number(latClean),
        lng: Number(lngClean),
      })
        .then(() => {
          toast.success("Planta creada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      ManufacturingPlantsService.update(idCurrent, {
        name: nameClean,
        link: linkClean,
        lat: Number(latClean),
        lng: Number(lngClean),
      })
        .then(() => {
          toast.success("Planta actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/manufacturing-plants");
  };

  const isValidateForm = useMemo(
    () =>
      !form.name?.trim() ||
      !form.link?.trim() ||
      !form.lat?.trim() ||
      !form.lng?.trim(),
    [form]
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    ManufacturingPlantsService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        link: data.link,
        lat: data.lat.toString(),
        lng: data.lng.toString(),
      });
    });
  }, [searchParams]);

  return (
    <Grid container spacing={2}>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Paper>
          <TextField
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
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Paper>
          <TextField
            label="Link"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.link}
            onChange={(e) =>
              setForm({
                ...form,
                link: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Paper>
          <TextField
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Latitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lat}
            onChange={(e) =>
              setForm({
                ...form,
                lat: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 3
        }}>
        <Paper>
          <TextField
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Longitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lng}
            onChange={(e) =>
              setForm({
                ...form,
                lng: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 3,
          md: 3
        }}>
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
          md: 3
        }}>
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

export default ManufacturingPlantsFormPage;

