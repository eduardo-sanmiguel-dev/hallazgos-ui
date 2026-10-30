"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

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
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/gemba-walk/evaluations";

const GembaWalkEvaluationsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    category: "",
    area: "",
    description: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  // Con una sola planta se elige sola: al crear no cuenta como captura.
  const leave = useLeaveConfirm(form, {
    isEditing: !!idCurrent,
    ignoreOnCreate: ["manufacturingPlantId"],
  });

  const record = useEditRecord(
    idCurrent,
    GembaWalkEvaluationsService.findOne,
    (data) => {
      const loaded = {
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        category: data.category,
        area: data.area,
        description: data.description,
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const area = form.area.trim();
    const description = form.description.trim();

    // Todo lo que falta, en el orden de la pantalla (antes "Guardar" se
    // deshabilitaba y la categoría aparecía en rojo desde que se abría).
    if (
      failAll({
        manufacturingPlantId: !manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        category: !form.category ? "Selecciona la categoría." : undefined,
        area: !area ? "Escribe el área." : undefined,
        description: !description ? "Escribe la descripción." : undefined,
      })
    ) {
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
        router.push(LIST_HREF);
      })
      .catch(failFromApi)
      .finally(() => setIsLoading(false));
  };

  const title = idCurrent
    ? "Editar concepto de evaluación"
    : "Nuevo concepto de evaluación";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Concepto no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Clasificación"
        description="Planta, categoría y área a la que pertenece la evaluación."
      >
        <SelectManufacturingPlantsOwn
          size={{ xs: 12, sm: 6 }}
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              manufacturingPlantId: e.target.value,
            }))
          }
          error={errorOf("manufacturingPlantId")}
        />
        <Grid size={{ xs: 12, sm: 6 }}>
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
          />
          {errorOf("category") && (
            <FormHelperText data-error-for="category" error>
              {errorOf("category")}
            </FormHelperText>
          )}
        </Grid>
        <Grid size={{ xs: 12 }}>
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
      </FormSection>
      <FormSection
        title="Qué se verifica"
        description="Lo que el observador revisa durante el recorrido."
      >
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
        onCancel={() => leave.go(LIST_HREF)}
        onSave={save}
        isSaving={isLoading}
      />
      {leave.confirmDialog}
    </FormContainer>
  );
};

export default GembaWalkEvaluationsFormPage;
