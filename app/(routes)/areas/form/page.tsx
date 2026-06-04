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

import { AreasService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import AreaImageCoordinateSelector, {
  type AreaMarkedPoint,
} from "../_components/AreaImageCoordinateSelector";

const AreasFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pointToPersist, setPointToPersist] = useState<AreaMarkedPoint | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
  });
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
      AreasService.create({
        name: nameClean,
        manufacturingPlantId,
        ...(pointToPersist && {
          coordinateX: pointToPersist.x,
          coordinateY: pointToPersist.y,
          zoomLevel: pointToPersist.zoom,
        }),
      })
        .then(() => {
          toast.success("Área creada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      AreasService.update(idCurrent, {
        name: nameClean,
        manufacturingPlantId,
        ...(pointToPersist && {
          coordinateX: pointToPersist.x,
          coordinateY: pointToPersist.y,
          zoomLevel: pointToPersist.zoom,
        }),
      })
        .then(() => {
          toast.success("Área actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/areas");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.manufacturingPlantId,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    AreasService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
      });

      if (
        data.coordinateX !== null &&
        data.coordinateX !== undefined &&
        data.coordinateY !== null &&
        data.coordinateY !== undefined
      ) {
        const zoom = data.zoomLevel || 1;
        setPointToPersist({
          x: data.coordinateX,
          y: data.coordinateY,
          zoom,
        });
      } else {
        setPointToPersist(null);
      }
    });
  }, [searchParams]);

  return (
    <Grid
      container
      spacing={2}
      sx={{
        minHeight: "calc(100vh - 200px)",
      }}
    >
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

      <Grid
        size={{
          xs: 12,
        }}
        sx={{
          display: "flex",
          pt: "0 !important",
        }}
      >
        <AreaImageCoordinateSelector
          imageSrc="/images/planos.png"
          initialPoint={pointToPersist}
          onPointChange={setPointToPersist}
        />
      </Grid>
    </Grid>
  );
};

export default AreasFormPage;

