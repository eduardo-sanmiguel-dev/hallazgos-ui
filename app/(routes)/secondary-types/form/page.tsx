"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";
import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";

import { SecondaryTypesService } from "@services";
import SelectMainTypes from "@components/SelectMainTypes";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const SecondaryTypesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    mainTypeId: "",
    typeResponsible: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "name"
    | "mainTypeId"
    | "typeResponsible"
  >(form);

  const save = () => {
    const nameClean = form.name.trim();
    const mainTypeId = Number(form.mainTypeId);
    const typeResponsible = form.typeResponsible;

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!mainTypeId) {
      fail("mainTypeId", "El tipo de criterio es requerido");
      return;
    }

    if (!typeResponsible) {
      fail("typeResponsible", "El tipo de responsable es requerido");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: nameClean,
      mainTypeId,
      typeResponsible,
    };

    if (!idCurrent) {
      SecondaryTypesService.create(payload)
        .then(() => {
          toast.success("Tipo de criterio creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      SecondaryTypesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Tipo de criterio actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/secondary-types");
  };

  const isValidateForm = useMemo(
    () => !form.name?.trim() || !form.mainTypeId,
    [form]
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    SecondaryTypesService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        mainTypeId: `${data.mainType.id}`,
        typeResponsible: data.typeResponsible,
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar tipo de criterio" : "Nuevo tipo de criterio"}
      />
      <FormSection>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
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
            md: 4
          }}>
          <SelectMainTypes
            value={form.mainTypeId}
            onChange={(e) =>
              setForm({
                ...form,
                mainTypeId: e.target.value,
              })
            }
          />
          {errorOf("mainTypeId") && (
            <FormHelperText error>{errorOf("mainTypeId")}</FormHelperText>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4
          }}>
          <FormControl fullWidth>
            <InputLabel id="responsible-type-select-label">
              Responsable
            </InputLabel>
            <Select
              labelId="responsible-type-select-label"
              id="responsible-type-select"
              value={form.typeResponsible}
              label="Responsable (opcional)"
              onChange={(e: SelectChangeEvent) =>
                setForm({
                  ...form,
                  typeResponsible: e.target.value as string,
                })
              }
            >
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
              <MenuItem value="Seguridad">Seguridad</MenuItem>
            </Select>
            {errorOf("typeResponsible") && (
              <FormHelperText error>
                {errorOf("typeResponsible")}
              </FormHelperText>
            )}
          </FormControl>
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

export default SecondaryTypesFormPage;

