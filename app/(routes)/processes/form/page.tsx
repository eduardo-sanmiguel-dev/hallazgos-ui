"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { ProcessesService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/processes";

interface ProcessForm {
  name: string;
  manufacturingPlantId: string;
}

const EMPTY_FORM: ProcessForm = { name: "", manufacturingPlantId: "" };

const ProcessesFormPage = () => {
  const [form, setForm] = useState<ProcessForm>(EMPTY_FORM);

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(
    "processes",
    idCurrent,
    ProcessesService.findOne,
    (data) => {
      const loaded = {
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant.id}`,
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ProcessesService.create>[0]) =>
      idCurrent
        ? ProcessesService.update(idCurrent, payload)
        : ProcessesService.create(payload),
    onSuccess: () => {
      toast.success(
        idCurrent
          ? "Proceso actualizado correctamente"
          : "Proceso creado correctamente",
      );
      router.push(LIST_HREF);
    },
    onError: (error) => failFromApi(error),
  });

  const save = () => {
    const nameClean = form.name.trim();
    const manufacturingPlantId = Number(form.manufacturingPlantId);

    // Todo lo que falta, en el orden de la pantalla (antes "Guardar" se
    // deshabilitaba sin decir qué faltaba).
    if (
      failAll({
        name: !nameClean ? "Escribe el nombre." : undefined,
        manufacturingPlantId: !manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
      })
    ) {
      return;
    }

    saveMutation.mutate({
      name: nameClean,
      manufacturingPlantId,
    });
  };

  const title = idCurrent ? "Editar proceso" : "Nuevo proceso";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Proceso no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos del proceso"
        description="Nombre del proceso y planta a la que pertenece."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
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
      </FormSection>
      <FormActions
        onCancel={() => leave.go(LIST_HREF)}
        onSave={save}
        isSaving={saveMutation.isPending}
      />
      {leave.confirmDialog}
    </FormContainer>
  );
};

export default ProcessesFormPage;
