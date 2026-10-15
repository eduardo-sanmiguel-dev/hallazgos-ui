"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { toast } from "sonner";

import { AreasService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import AreaImageCoordinateSelector, {
  type AreaMarkedPoint,
} from "../_components/AreaImageCoordinateSelector";

const AreasFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pointToPersist, setPointToPersist] = useState<AreaMarkedPoint | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    "name" | "manufacturingPlantId"
  >(form);

  const save = () => {
    const nameClean = form.name.trim();
    const manufacturingPlantId = Number(form.manufacturingPlantId);

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!manufacturingPlantId) {
      fail("manufacturingPlantId", "La planta es requerida");
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
          toast.success("Área creada correctamente");
          cancel();
        })
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
          toast.success("Área actualizada correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/areas");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.manufacturingPlantId,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    AreasService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
      });

      if (
        data.coordinateX !== null &&
        data.coordinateX !== undefined &&
        data.coordinateY !== null &&
        data.coordinateY !== undefined
      ) {
        const zoom = data.zoomLevel || 1;
        setPointToPersist({
          x: data.coordinateX,
          y: data.coordinateY,
          zoom,
        });
      } else {
        setPointToPersist(null);
      }
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar zona" : "Nueva zona"} />
      <FormSection>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
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
            <FormHelperText error>
              {errorOf("manufacturingPlantId")}
            </FormHelperText>
          </Grid>
        )}
      </FormSection>
      <FormSection title="Ubicación en el plano">
        <Grid size={{ xs: 12 }} sx={{ display: "flex" }}>
          <AreaImageCoordinateSelector
            imageSrc="/images/planos.png"
            initialPoint={pointToPersist}
            onPointChange={setPointToPersist}
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

export default AreasFormPage;

