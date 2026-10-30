"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { GembaWalkZonesService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/gemba-walk/zones";

const GembaWalkZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    nameZone: "",
    nameLocation: "",
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
    GembaWalkZonesService.findOne,
    (data) => {
      const loaded = {
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        nameZone: data.nameZone,
        nameLocation: data.nameLocation,
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const nameZone = form.nameZone.trim();
    const nameLocation = form.nameLocation.trim();

    // Todo lo que falta, en el orden de la pantalla (antes "Guardar" se
    // deshabilitaba sin decir qué faltaba).
    if (
      failAll({
        manufacturingPlantId: !manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        nameZone: !nameZone ? "Escribe la zona." : undefined,
        nameLocation: !nameLocation ? "Escribe la ubicación." : undefined,
      })
    ) {
      return;
    }

    setIsLoading(true);

    const payload = { manufacturingPlantId, nameZone, nameLocation };

    if (!idCurrent) {
      GembaWalkZonesService.create(payload)
        .then(() => {
          toast.success("Zona creada correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      GembaWalkZonesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Zona actualizada correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const title = idCurrent
    ? "Editar zona de Gemba Walk"
    : "Nueva zona de Gemba Walk";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Zona no encontrada"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos generales"
        description="Zona del recorrido y dónde está dentro de la planta."
      >
        <SelectManufacturingPlantsOwn
          size={{ xs: 12, sm: 4 }}
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm({
              ...form,
              manufacturingPlantId: e.target.value,
            })
          }
          error={errorOf("manufacturingPlantId")}
        />
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...fieldProps("nameZone")}
            required
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
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...fieldProps("nameLocation")}
            required
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

export default GembaWalkZonesFormPage;
