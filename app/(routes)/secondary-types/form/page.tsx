"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

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
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/secondary-types";

const SecondaryTypesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    mainTypeId: "",
    typeResponsible: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(
    idCurrent,
    SecondaryTypesService.findOne,
    (data) => {
      const loaded = {
        name: data.name,
        mainTypeId: `${data.mainType.id}`,
        // Hay registros sin responsable: al guardar se pide elegirlo.
        typeResponsible: data.typeResponsible ?? "",
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const save = () => {
    const nameClean = form.name.trim();
    const mainTypeId = Number(form.mainTypeId);
    const typeResponsible = form.typeResponsible;

    // Todo lo que falta, en el orden de la pantalla.
    if (
      failAll({
        name: !nameClean ? "Escribe el nombre." : undefined,
        mainTypeId: !mainTypeId ? "Selecciona el criterio." : undefined,
        typeResponsible: !typeResponsible
          ? "Selecciona el responsable."
          : undefined,
      })
    ) {
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
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      SecondaryTypesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Tipo de criterio actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const title = idCurrent
    ? "Editar tipo de criterio"
    : "Nuevo tipo de criterio";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Tipo de criterio no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
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
            <FormHelperText data-error-for="mainTypeId" error>
              {errorOf("mainTypeId")}
            </FormHelperText>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <FormControl fullWidth required error={!!errorOf("typeResponsible")}>
            <InputLabel id="responsible-type-select-label">
              Responsable
            </InputLabel>
            <Select
              labelId="responsible-type-select-label"
              id="responsible-type-select"
              value={form.typeResponsible}
              label="Responsable *"
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
              <FormHelperText data-error-for="typeResponsible" error>
                {errorOf("typeResponsible")}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
      </FormSection>
      <FormActions
        onCancel={() => leave.go(LIST_HREF)}
        onSave={save}
        isSaving={isLoading}
      />
      {leave.confirmDialog}
    </>
  );
};

export default SecondaryTypesFormPage;
