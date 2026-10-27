"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { ProcessesService } from "@services";
import SelectManufacturingPlants from "@components/SelectManufacturingPlants";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const ProcessesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    manufacturingPlantId: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, failFromApi, errorOf, fieldProps } = useFieldErrors<
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
      ProcessesService.create({
        name: nameClean,
        manufacturingPlantId,
      })
        .then(() => {
          toast.success("Proceso creado correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      ProcessesService.update(idCurrent, {
        name: nameClean,
        manufacturingPlantId,
      })
        .then(() => {
          toast.success("Proceso actualizado correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/processes");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.manufacturingPlantId,
    [form]
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    ProcessesService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        manufacturingPlantId: `${data.manufacturingPlant.id}`,
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar proceso" : "Nuevo proceso"} />
      <FormSection>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3
          }}>
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
            md: 3
          }}>
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
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isValidateForm}
      />
    </>
  );
};

export default ProcessesFormPage;

