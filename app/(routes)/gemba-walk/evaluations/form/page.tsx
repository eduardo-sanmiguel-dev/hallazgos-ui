"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { GembaWalkEvaluationsService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { categoryOptions } from "../_components/FiltersGembaWalkEvaluations";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

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
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "manufacturingPlantId"
    | "category"
    | "area"
    | "description"
  >(form);

  const cancel = () => {
    router.push("/gemba-walk/evaluations");
  };

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const area = form.area.trim();
    const description = form.description.trim();

    if (!manufacturingPlantId) {
      fail("manufacturingPlantId", "La planta es requerida");
      return;
    }

    if (!form.category) {
      fail("category", "La categoría es requerida");
      return;
    }

    if (!area) {
      fail("area", "El área es requerida");
      return;
    }

    if (!description) {
      fail("description", "La descripción es requerida");
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
    <>
      <PageHeader
        title={idCurrent ? "Editar concepto de evaluación" : "Nuevo concepto de evaluación"}
      />
      <FormSection>
        <SelectManufacturingPlantsOwn
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              manufacturingPlantId: e.target.value,
            }))
          }
        />
        {errorOf("manufacturingPlantId") && (
          <Grid size={{ xs: 12 }}>
            <FormHelperText error>
              {errorOf("manufacturingPlantId")}
            </FormHelperText>
          </Grid>
        )}
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
          {errorOf("category") && (
            <FormHelperText error>{errorOf("category")}</FormHelperText>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <TextField
            {...fieldProps("area")}
            required
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
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            {...fieldProps("description")}
            required
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
        </Grid>
      </FormSection>
      <FormActions
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isValidateForm}
      />
    </>
  );
};

export default GembaWalkEvaluationsFormPage;
