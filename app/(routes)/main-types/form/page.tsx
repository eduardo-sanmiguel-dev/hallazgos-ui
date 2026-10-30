"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Checkbox, FormControlLabel, Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { MainTypesService } from "@services";
import { useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/main-types";

const MainTypesFormPage = () => {
  const [form, setForm] = useState({
    name: "",
    requiresEvidence: true,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  const { failAll, failFromApi, fieldProps } = useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });
  // La foto obligatoria solo la cambia un administrador (el API también lo exige).
  const isAdmin =
    useUserSessionStore((state) => state.role) === ROLE_ADMINISTRADOR;

  const record = useEditRecord(
    "main-types",
    idCurrent,
    MainTypesService.findOne,
    (data) => {
      const loaded = {
        name: data.name,
        requiresEvidence: data.requiresEvidence !== false,
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof MainTypesService.create>[0]) =>
      idCurrent
        ? MainTypesService.update(idCurrent, payload)
        : MainTypesService.create(payload),
    onSuccess: () => {
      toast.success(
        idCurrent
          ? "Criterio actualizado correctamente"
          : "Criterio creado correctamente",
      );
      router.push(LIST_HREF);
    },
    onError: (error) => failFromApi(error),
  });

  const save = () => {
    const nameClean = form.name.trim();

    // Antes "Guardar" se deshabilitaba sin decir qué faltaba.
    if (failAll({ name: !nameClean ? "Escribe el nombre." : undefined })) {
      return;
    }
    const payload = {
      name: nameClean,
      ...(isAdmin && { requiresEvidence: form.requiresEvidence }),
    };

    saveMutation.mutate(payload);
  };

  const title = idCurrent ? "Editar criterio" : "Nuevo criterio";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Criterio no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos del criterio"
        description="Clasificación principal de un hallazgo."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
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
        {isAdmin && (
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.requiresEvidence}
                  onChange={(e) =>
                    setForm({ ...form, requiresEvidence: e.target.checked })
                  }
                />
              }
              label="Requiere evidencia fotográfica"
            />
          </Grid>
        )}
      </FormSection>
      <FormActions
        onCancel={() => leave.go(LIST_HREF)}
        onSave={save}
        isSaving={saveMutation.isPending}
      />
      {leave.confirmDialog}
    </FormContainer>
  );
};

export default MainTypesFormPage;
