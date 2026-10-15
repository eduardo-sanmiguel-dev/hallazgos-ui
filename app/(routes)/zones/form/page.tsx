"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { AreasService, ZonesService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import SelectDefault from "@components/SelectDefault";
import { Area } from "@interfaces";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const ZonesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
    areaId: "",
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "name"
    | "manufacturingPlantId"
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
      ZonesService.create({
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Lugar creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      ZonesService.update(idCurrent, {
        name: nameClean,
        manufacturingPlantId,
        areaId: form.areaId ? Number(form.areaId) : null,
      })
        .then(() => {
          toast.success("Lugar actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/zones");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.manufacturingPlantId,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    ZonesService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant.id}`,
        areaId: data.area?.id ? `${data.area.id}` : "",
      });
    });
  }, [searchParams]);

  useEffect(() => {
    AreasService.findAll({}).then((data) => {
      const orderedAreas = [...data].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
      );

      setAreas(orderedAreas);
    });
  }, []);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar lugar" : "Nuevo lugar"} />
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
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
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
        <Grid
          size={{
            xs: 12,
            sm: 3,
            md: 4,
          }}
        >
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
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isValidateForm}
      />
    </>
  );
};

export default ZonesFormPage;

