"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { InputAdornment } from "@mui/material";
import { toast } from "sonner";

import { EquipmentsService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { useUserSessionStore } from "@store";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import {
  DECIMAL_INPUT,
  NUMERIC_INPUT,
  toDecimal,
  toPositiveInteger,
} from "@shared/utils/inputModes";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/equipments";

interface EquipmentForm {
  name: string;
  deliveryFrequency: string;
  manufacturingPlantId: string;
  price: string;
}

const EMPTY_FORM: EquipmentForm = {
  name: "",
  deliveryFrequency: "",
  manufacturingPlantId: "",
  price: "",
};

// Antes era un diálogo sobre la lista; ahora es su propia ruta, como el
// resto de los catálogos de Configuración.
const EquipmentsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState<EquipmentForm>(EMPTY_FORM);

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  // Con una sola planta se elige sola: al crear no cuenta como captura.
  const leave = useLeaveConfirm(form, {
    isEditing: !!idCurrent,
    ignoreOnCreate: ["manufacturingPlantId"],
  });

  const record = useEditRecord(idCurrent, EquipmentsService.findOne, (data) => {
    const loaded = {
      name: data.name,
      deliveryFrequency: data?.deliveryFrequency
        ? String(data.deliveryFrequency)
        : "",
      manufacturingPlantId: String(data.manufacturingPlant.id),
      price: data?.costHistory.length ? String(data.costHistory[0].price) : "",
    };
    setForm(loaded);
    leave.markPristine(loaded);
  });

  useEffect(() => {
    if (!idCurrent && manufacturingPlants.length === 1) {
      setForm((prev) => ({
        ...prev,
        manufacturingPlantId: String(manufacturingPlants[0].id),
      }));
    }
  }, [manufacturingPlants, idCurrent]);

  const save = () => {
    const nameClean = form.name.trim();
    const deliveryFrequencyClean = Number(form.deliveryFrequency.trim() || 0);
    const priceClean = Number(form.price.trim() || 0);

    // Todo lo que falta, en el orden de la pantalla.
    if (
      failAll({
        manufacturingPlantId: !form.manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        name: !nameClean ? "Escribe el nombre." : undefined,
      })
    ) {
      return;
    }

    const payload = {
      name: nameClean,
      deliveryFrequency:
        deliveryFrequencyClean > 0 ? deliveryFrequencyClean : null,
      manufacturingPlantId: Number(form.manufacturingPlantId),
      price: priceClean > 0 ? priceClean : null,
    };

    setIsLoading(true);

    if (!idCurrent) {
      EquipmentsService.create(payload)
        .then(() => {
          toast.success("Equipo creado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      EquipmentsService.update(idCurrent, payload)
        .then(() => {
          toast.success("Equipo actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const title = idCurrent ? "Editar equipo" : "Nuevo equipo";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Equipo no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos del equipo"
        description="Nombre del equipo y planta donde se entrega."
      >
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
      </FormSection>
      <FormSection
        title="Entrega y costo"
        description="Opcionales: cada cuántos días se entrega y su precio."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("deliveryFrequency")}
            label="Frecuencia de entrega (días)"
            variant="outlined"
            fullWidth
            autoComplete="off"
            // Teclado numérico (B1); antes type="number" con teclas
            // bloqueadas.
            slotProps={{ htmlInput: NUMERIC_INPUT }}
            onChange={(e) =>
              setForm({
                ...form,
                deliveryFrequency: toPositiveInteger(e.target.value),
              })
            }
            value={form.deliveryFrequency}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("price")}
            label="Precio"
            variant="outlined"
            fullWidth
            autoComplete="off"
            // Teclado numérico con punto (B1).
            slotProps={{
              htmlInput: DECIMAL_INPUT,
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
            }}
            onChange={(e) =>
              setForm({
                ...form,
                price: toDecimal(e.target.value),
              })
            }
            value={form.price}
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

export default EquipmentsFormPage;
