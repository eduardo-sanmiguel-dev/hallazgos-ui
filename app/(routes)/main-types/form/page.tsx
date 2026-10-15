"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { MainTypesService } from "@services";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const MainTypesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, fieldProps } = useFieldErrors<"name">(form);

  const save = () => {
    const nameClean = form.name.trim();

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }
    setIsLoading(true);

    if (!idCurrent) {
      MainTypesService.create({
        name: nameClean,
      })
        .then(() => {
          toast.success("Criterio creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      MainTypesService.update(idCurrent, {
        name: nameClean,
      })
        .then(() => {
          toast.success("Criterio actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/main-types");
  };

  const isValidateForm = useMemo(() => !form.name?.trim(), [form]);

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    MainTypesService.findOne(id).then((data) => {
      setForm({
        name: data.name,
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar criterio" : "Nuevo criterio"} />
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
            label="Nombre"
            required
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
      <FormActions
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isValidateForm}
      />
    </>
  );
};

export default MainTypesFormPage;

