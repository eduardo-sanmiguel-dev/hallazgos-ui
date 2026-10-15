"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { GembaWalkZonesService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const GembaWalkZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    nameZone: "",
    nameLocation: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "manufacturingPlantId"
    | "nameZone"
    | "nameLocation"
  >(form);

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const nameZone = form.nameZone.trim();
    const nameLocation = form.nameLocation.trim();

    if (!manufacturingPlantId) {
      fail("manufacturingPlantId", "La planta es requerida");
      return;
    }

    if (!nameZone) {
      fail("nameZone", "La zona es requerida");
      return;
    }

    if (!nameLocation) {
      fail("nameLocation", "La ubicación es requerida");
      return;
    }

    setIsLoading(true);

    const payload = { manufacturingPlantId, nameZone, nameLocation };

    if (!idCurrent) {
      GembaWalkZonesService.create(payload)
        .then(() => {
          toast.success("Zona creada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      GembaWalkZonesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Zona actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/gemba-walk/zones");
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.nameZone?.trim() ||
      !form.nameLocation?.trim(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    GembaWalkZonesService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        nameZone: data.nameZone,
        nameLocation: data.nameLocation,
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar zona de Gemba Walk" : "Nueva zona de Gemba Walk"}
      />
      <FormSection>
        <SelectManufacturingPlantsOwn
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm({
              ...form,
              manufacturingPlantId: e.target.value,
            })
          }
        />
        {errorOf("manufacturingPlantId") && (
          <Grid size={{ xs: 12 }}>
            <FormHelperText data-error-for="manufacturingPlantId" error>
              {errorOf("manufacturingPlantId")}
            </FormHelperText>
          </Grid>
        )}
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
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
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
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
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isValidateForm}
      />
    </>
  );
};

export default GembaWalkZonesFormPage;
