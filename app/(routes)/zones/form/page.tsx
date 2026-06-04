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
import Box from "@mui/material/Box";

import { AreasService, ZonesService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectDefault from "@components/SelectDefault";
import { Area } from "@interfaces";

const ZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
    areaId: "",
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const save = () => {
    const nameClean = form.name.trim();
    const manufacturingPlantId = Number(form.manufacturingPlantId);

    if (!nameClean) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    setIsLoading(true);

    if (!idCurrent) {
      ZonesService.create({
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Zona creada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      ZonesService.update(idCurrent, {
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Zona actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/zones");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.manufacturingPlantId,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    ZonesService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant.id}`,
        areaId: data.area?.id ? `${data.area.id}` : "",
      });
    });
  }, [searchParams]);

  useEffect(() => {
    AreasService.findAll({}).then((data) => {
      const orderedAreas = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      );

      setAreas(orderedAreas);
    });
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 4,
        }}
      >
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
          md: 4,
        }}
      >
        <Paper>
          <SelectManufacturingPlants
            value={form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                manufacturingPlantId: e.target.value,
              })
            }
          />
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 3,
          md: 4,
        }}
      >
        <SelectDefault
          data={areas}
          label="Zona (opcional)"
          value={form.areaId}
          onChange={(e) =>
            setForm({
              ...form,
              areaId: e.target.value,
            })
          }
          isFilter={true}
        />
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 12,
          md: 12,
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="error"
            startIcon={<CloseIcon />}
            onClick={cancel}
            fullWidth
          >
            Cancelar
          </Button>

          <Button
            loading={isLoading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            variant="contained"
            color="primary"
            onClick={save}
            disabled={isValidateForm || isLoading}
            fullWidth
          >
            Guardar
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ZonesFormPage;

