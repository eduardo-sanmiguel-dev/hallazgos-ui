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

import { GembaWalkEvaluationsService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { categoryOptions } from "../_components/FiltersGembaWalkEvaluations";

const GembaWalkEvaluationsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    category: "",
    area: "",
    description: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const cancel = () => {
    router.push("/gemba-walk/evaluations");
  };

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const area = form.area.trim();
    const description = form.description.trim();

    if (!manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    if (!form.category) {
      toast.error("La categoría es requerida");
      return;
    }

    if (!area) {
      toast.error("El área es requerida");
      return;
    }

    if (!description) {
      toast.error("La descripción es requerida");
      return;
    }

    setIsLoading(true);

    const payload = {
      manufacturingPlantId,
      category: form.category,
      area,
      description,
    };

    const request = idCurrent
      ? GembaWalkEvaluationsService.update(idCurrent, payload)
      : GembaWalkEvaluationsService.create(payload);

    request
      .then(() => {
        toast.success(
          idCurrent
            ? "Concepto actualizado correctamente"
            : "Concepto creado correctamente",
        );
        cancel();
      })
      .finally(() => setIsLoading(false));
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.category ||
      !form.area.trim() ||
      !form.description.trim(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    GembaWalkEvaluationsService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        category: data.category,
        area: data.area,
        description: data.description,
      });
    });
  }, [searchParams]);

  return (
    <Grid container spacing={2}>
      <SelectManufacturingPlantsOwn
        value={form.manufacturingPlantId}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            manufacturingPlantId: e.target.value,
          }))
        }
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectDefault
          data={categoryOptions}
          label="Categoría"
          value={form.category}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              category: e.target.value,
            }))
          }
          validationEmpty
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 12, md: 6 }}>
        <Paper>
          <TextField
            label="Área"
            placeholder="Ej. EPP, Rutas de Evacuación y Salidas, 1'S - Clasificación"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.area}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                area: e.target.value,
              }))
            }
          />
        </Paper>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Paper>
          <TextField
            label="Descripción"
            placeholder="Qué se debe verificar durante el recorrido"
            variant="outlined"
            fullWidth
            multiline
            minRows={4}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
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
      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
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

export default GembaWalkEvaluationsFormPage;
