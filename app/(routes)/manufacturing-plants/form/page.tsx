"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { ManufacturingPlantsService } from "@services";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/manufacturing-plants";

interface PlantForm {
  name: string;
  link: string;
  lat: string;
  lng: string;
}

const EMPTY_FORM: PlantForm = { name: "", link: "", lat: "", lng: "" };

// Coordenada en grados decimales con punto (19.4326, -99.1332). Teclado de
// texto (B1): la longitud es negativa en México y Colombia y el teclado
// decimal del iPhone no tiene signo menos. Mismos rangos que valida el API.
const COORDINATE = /^-?\d{1,3}(\.\d+)?$/;

const coordinateError = (
  value: string,
  label: "latitud" | "longitud",
  max: number,
) => {
  if (!value) return `Escribe la ${label}.`;
  const number = Number(value);
  return COORDINATE.test(value) && Math.abs(number) <= max
    ? undefined
    : `La ${label} debe ser un número entre -${max} y ${max}, con punto decimal (por ejemplo, ${label === "latitud" ? "19.4326" : "-99.1332"}).`;
};

// Se acepta la coma decimal al escribir; se guarda con punto.
const normalizeCoordinate = (value: string) =>
  value.replace(",", ".").replace(/\s/g, "");

const ManufacturingPlantsFormPage = () => {
  const [form, setForm] = useState<PlantForm>(EMPTY_FORM);

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, fieldProps } = useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(
    "manufacturing-plants",
    idCurrent,
    ManufacturingPlantsService.findOne,
    (data) => {
      const loaded = {
        name: data.name,
        link: data.link,
        lat: data.lat.toString(),
        lng: data.lng.toString(),
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const saveMutation = useMutation({
    mutationFn: (
      payload: Parameters<typeof ManufacturingPlantsService.create>[0],
    ) =>
      idCurrent
        ? ManufacturingPlantsService.update(idCurrent, payload)
        : ManufacturingPlantsService.create(payload),
    onSuccess: () => {
      toast.success(
        idCurrent
          ? "Planta actualizada correctamente"
          : "Planta creada correctamente",
      );
      router.push(LIST_HREF);
    },
    onError: (error) => failFromApi(error),
  });

  const save = () => {
    const nameClean = form.name.trim();
    const linkClean = form.link.trim();
    const latClean = form.lat.trim();
    const lngClean = form.lng.trim();

    // Todo lo que falta o no tiene formato, en el orden de la pantalla.
    if (
      failAll({
        name: !nameClean ? "Escribe el nombre." : undefined,
        link: !linkClean ? "Escribe el link." : undefined,
        lat: coordinateError(latClean, "latitud", 90),
        lng: coordinateError(lngClean, "longitud", 180),
      })
    ) {
      return;
    }

    const payload = {
      name: nameClean,
      link: linkClean,
      lat: Number(latClean),
      lng: Number(lngClean),
    };

    saveMutation.mutate(payload);
  };

  const title = idCurrent ? "Editar planta" : "Nueva planta";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Planta no encontrada"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos de la planta"
        description="Nombre de la planta y su link."
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
          <TextField
            {...fieldProps("link")}
            required
            label="Link"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.link}
            // Teclado de direcciones web, sin mayúscula inicial.
            slotProps={{
              htmlInput: { inputMode: "url", autoCapitalize: "none" },
            }}
            onChange={(e) =>
              setForm({
                ...form,
                link: e.target.value,
              })
            }
          />
        </Grid>
      </FormSection>
      <FormSection
        title="Ubicación"
        description="Coordenadas de la planta en el mapa."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("lat")}
            required
            label="Latitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lat}
            onChange={(e) =>
              setForm({
                ...form,
                lat: normalizeCoordinate(e.target.value),
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("lng")}
            required
            label="Longitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lng}
            onChange={(e) =>
              setForm({
                ...form,
                lng: normalizeCoordinate(e.target.value),
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

export default ManufacturingPlantsFormPage;
