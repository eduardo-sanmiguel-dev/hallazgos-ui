"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { ZonesService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectDefault from "@components/SelectDefault";
import { useAreas } from "@hooks";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/zones";

const ZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
    areaId: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(idCurrent, ZonesService.findOne, (data) => {
    const loaded = {
      name: data.name,
      manufacturingPlantId: `${data.manufacturingPlant.id}`,
      areaId: data.area?.id ? `${data.area.id}` : "",
    };
    setForm(loaded);
    leave.markPristine(loaded);
  });

  const save = () => {
    const nameClean = form.name.trim();
    const manufacturingPlantId = Number(form.manufacturingPlantId);

    // Todo lo que falta, en el orden de la pantalla.
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

    setIsLoading(true);

    if (!idCurrent) {
      ZonesService.create({
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Lugar creado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      ZonesService.update(idCurrent, {
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Lugar actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const { data: allAreas } = useAreas();
  const areas = useMemo(
    () =>
      [...(allAreas ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      ),
    [allAreas],
  );

  const title = idCurrent ? "Editar lugar" : "Nuevo lugar";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Lugar no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos del lugar"
        description="Nombre del lugar, la planta donde está y, si aplica, su zona."
      >
        <Grid size={{ xs: 12, sm: 4 }}>
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
        <Grid size={{ xs: 12, sm: 4 }}>
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
        <Grid size={{ xs: 12, sm: 4 }}>
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

export default ZonesFormPage;
