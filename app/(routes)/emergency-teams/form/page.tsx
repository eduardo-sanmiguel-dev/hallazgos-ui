"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { toast } from "sonner";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { EmergencyTeamsService } from "@services";
import { ExtinguisherType } from "@interfaces";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";
import { DECIMAL_INPUT, toDecimal } from "@shared/utils/inputModes";

const LIST_HREF = "/emergency-teams";

const extinguisherTypes = [
  ExtinguisherType.PQS,
  ExtinguisherType.CO2,
  ExtinguisherType.AFFF,
  ExtinguisherType.EXTINTOR_TIPO_D,
  ExtinguisherType.EXTINTOR_DE_SOLKAFLAN,
];

const EmergencyTeamsFormPage = () => {
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    location: "",
    extinguisherNumber: "",
    typeOfExtinguisher: "" as ExtinguisherType | "",
    capacity: "",
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
    "emergency-teams",
    idCurrent,
    EmergencyTeamsService.findOne,
    (data) => {
      const loaded = {
        manufacturingPlantId: data.manufacturingPlant?.id?.toString() || "",
        location: data.location,
        extinguisherNumber: data.extinguisherNumber.toString(),
        typeOfExtinguisher: data.typeOfExtinguisher,
        capacity: data.capacity.toString(),
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const saveMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof EmergencyTeamsService.create>[0],
    ) =>
      idCurrent
        ? EmergencyTeamsService.update(idCurrent, payload)
        : EmergencyTeamsService.create(payload),
    onSuccess: () => {
      toast.success(
        idCurrent
          ? "Equipo de emergencia actualizado correctamente"
          : "Equipo de emergencia creado correctamente",
      );
      router.push(LIST_HREF);
    },
    onError: (error) => failFromApi(error),
  });

  const save = () => {
    const locationClean = form.location.trim();
    const extinguisherNumberClean = form.extinguisherNumber.trim();
    const capacityClean = form.capacity.trim();

    // Todo lo que falta, en el orden de la pantalla (antes "Guardar" se
    // deshabilitaba sin decir qué faltaba).
    if (
      failAll({
        manufacturingPlantId: !form.manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        location: !locationClean ? "Escribe la ubicación." : undefined,
        extinguisherNumber: !extinguisherNumberClean
          ? "Escribe el número de extintor."
          : undefined,
        typeOfExtinguisher: !form.typeOfExtinguisher
          ? "Selecciona el tipo de extintor."
          : undefined,
        capacity: !capacityClean ? "Escribe la capacidad." : undefined,
      })
    ) {
      return;
    }

    const payload = {
      location: locationClean,
      extinguisherNumber: extinguisherNumberClean,
      typeOfExtinguisher: form.typeOfExtinguisher as ExtinguisherType,
      capacity: Number(capacityClean),
      manufacturingPlantId: Number(form.manufacturingPlantId),
    };

    saveMutation.mutate(payload);
  };

  const title = idCurrent
    ? "Editar equipo de emergencia"
    : "Nuevo equipo de emergencia";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Equipo de emergencia no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Planta y lugar"
        description="Elige primero la planta: el resto de los campos se habilita después."
      >
        <SelectManufacturingPlantsOwn
          size={{ xs: 12, sm: 6 }}
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm({
              ...form,
              manufacturingPlantId: e.target.value,
            })
          }
          error={errorOf("manufacturingPlantId")}
        />
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("location")}
            required
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
        </Grid>
      </FormSection>
      <FormSection title="Extintor" description="Número, tipo y capacidad.">
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...fieldProps("extinguisherNumber")}
            required
            label="Núm. Extintor"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.extinguisherNumber}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                extinguisherNumber: e.target.value.replace(
                  /[^a-zA-Z0-9-]/g,
                  "",
                ),
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...fieldProps("typeOfExtinguisher")}
            required
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
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            {...fieldProps("capacity")}
            required
            label="Capacidad"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.capacity}
            disabled={!form.manufacturingPlantId}
            // Teclado numérico con punto (B1): hasta 2 decimales, como el API.
            slotProps={{ htmlInput: DECIMAL_INPUT }}
            onChange={(e) =>
              setForm({
                ...form,
                capacity: toDecimal(e.target.value),
              })
            }
          />
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

export default EmergencyTeamsFormPage;
