"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { AreasService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";
import AreaImageCoordinateSelector, {
  type AreaMarkedPoint,
} from "../_components/AreaImageCoordinateSelector";

const LIST_HREF = "/areas";

const AreasFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pointToPersist, setPointToPersist] = useState<AreaMarkedPoint | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  // El punto del plano también cuenta como captura. Con una sola planta, el
  // selector la elige solo: al crear no cuenta.
  const leave = useLeaveConfirm(
    { ...form, point: pointToPersist },
    { isEditing: !!idCurrent, ignoreOnCreate: ["manufacturingPlantId"] },
  );

  const record = useEditRecord(idCurrent, AreasService.findOne, (data) => {
    const loaded = {
      name: data.name,
      manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
    };
    const point =
      data.coordinateX !== null &&
      data.coordinateX !== undefined &&
      data.coordinateY !== null &&
      data.coordinateY !== undefined
        ? {
            x: data.coordinateX,
            y: data.coordinateY,
            zoom: data.zoomLevel || 1,
          }
        : null;
    setForm(loaded);
    setPointToPersist(point);
    leave.markPristine({ ...loaded, point });
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
          toast.success("Zona creada correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
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
          toast.success("Zona actualizada correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const title = idCurrent ? "Editar zona" : "Nueva zona";

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
        title="Datos de la zona"
        description="Nombre de la zona y planta a la que pertenece."
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
      </FormSection>
      <FormSection
        title="Ubicación en el plano"
        description="Opcional: marca en el plano dónde está la zona."
      >
        <Grid size={{ xs: 12 }} sx={{ display: "flex" }}>
          <AreaImageCoordinateSelector
            imageSrc="/images/planos.png"
            initialPoint={pointToPersist}
            onPointChange={setPointToPersist}
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

export default AreasFormPage;
