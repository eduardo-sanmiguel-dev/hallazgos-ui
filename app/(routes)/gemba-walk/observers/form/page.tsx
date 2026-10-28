"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { GembaWalkObserversService, UsersService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { useCatalog, useGembaWalkZones } from "@hooks";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/gemba-walk/observers";

interface Option {
  id: number;
  name: string;
}

const GembaWalkObserversFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState<{
    manufacturingPlantId: string;
    gembaWalkZoneId: string;
    userIds: string[];
  }>({
    manufacturingPlantId: "",
    gembaWalkZoneId: "",
    userIds: [],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf } = useFormFieldErrors(form);
  // Con una sola planta se elige sola: al crear no cuenta como captura.
  const leave = useLeaveConfirm(form, {
    isEditing: !!idCurrent,
    ignoreOnCreate: ["manufacturingPlantId"],
  });

  const record = useEditRecord(
    idCurrent,
    GembaWalkObserversService.findOne,
    (data) => {
      const loaded = {
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        gembaWalkZoneId: `${data.gembaWalkZone?.id || ""}`,
        userIds: data.user ? [`${data.user.id}`] : [],
      };
      setForm(loaded);
      leave.markPristine(loaded);
    },
  );

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const gembaWalkZoneId = Number(form.gembaWalkZoneId);
    const userIds = form.userIds.map(Number);

    // Todo lo que falta, en el orden de la pantalla (antes "Guardar" se
    // deshabilitaba y las listas aparecían en rojo desde que se abría).
    if (
      failAll({
        manufacturingPlantId: !manufacturingPlantId
          ? "Selecciona la planta."
          : undefined,
        gembaWalkZoneId: !gembaWalkZoneId ? "Selecciona la zona." : undefined,
        userIds: !userIds.length
          ? idCurrent
            ? "Selecciona el usuario."
            : "Selecciona al menos un usuario."
          : undefined,
      })
    ) {
      return;
    }

    setIsLoading(true);

    if (!idCurrent) {
      GembaWalkObserversService.create({
        manufacturingPlantId,
        gembaWalkZoneId,
        userIds,
      })
        .then((data) => {
          toast.success(
            data.length === 1
              ? "Observador creado correctamente"
              : `${data.length} observadores creados correctamente`,
          );
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      GembaWalkObserversService.update(idCurrent, {
        manufacturingPlantId,
        gembaWalkZoneId,
        userId: userIds[0],
      })
        .then(() => {
          toast.success("Observador actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  // Zonas y usuarios de la planta elegida (caché compartida).
  const { manufacturingPlantId } = form;
  const { data: gembaWalkZones } = useGembaWalkZones(
    { manufacturingPlantId },
    { enabled: !!manufacturingPlantId },
  );
  const { data: plantUsers } = useCatalog(
    "users",
    () => UsersService.findAll({ manufacturingPlantId }),
    { enabled: !!manufacturingPlantId, params: { manufacturingPlantId } },
  );

  const zones = useMemo<Option[]>(
    () =>
      manufacturingPlantId && gembaWalkZones
        ? gembaWalkZones.map((zone) => ({
            id: zone.id,
            name: `${zone.nameZone} - ${zone.nameLocation}`,
          }))
        : [],
    [manufacturingPlantId, gembaWalkZones],
  );
  const users = useMemo<Option[]>(
    () =>
      manufacturingPlantId && plantUsers
        ? plantUsers.map((user) => ({
            id: user.id,
            name: `${user.name} - ${user.email}`,
          }))
        : [],
    [manufacturingPlantId, plantUsers],
  );

  const title = idCurrent ? "Editar observador" : "Nuevo observador";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Observador no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection>
        <SelectManufacturingPlantsOwn
          value={form.manufacturingPlantId}
          onChange={(e) =>
            setForm((prev) =>
              prev.manufacturingPlantId === e.target.value
                ? prev
                : {
                    manufacturingPlantId: e.target.value,
                    gembaWalkZoneId: "",
                    userIds: [],
                  },
            )
          }
          error={errorOf("manufacturingPlantId")}
        />
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={zones}
            label="Zona"
            value={form.gembaWalkZoneId}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                gembaWalkZoneId: e.target.value,
              }))
            }
            disabled={!form.manufacturingPlantId}
          />
          {errorOf("gembaWalkZoneId") && (
            <FormHelperText data-error-for="gembaWalkZoneId" error>
              {errorOf("gembaWalkZoneId")}
            </FormHelperText>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 6,
          }}
        >
          {idCurrent ? (
            <SelectDefault
              data={users}
              label="Usuario"
              value={form.userIds[0] || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  userIds: e.target.value ? [e.target.value] : [],
                }))
              }
              disabled={!form.manufacturingPlantId}
            />
          ) : (
            <SelectDefault
              multiple
              data={users}
              label="Usuarios"
              value={form.userIds}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  userIds: e.target.value,
                }))
              }
              disabled={!form.manufacturingPlantId}
            />
          )}
          {errorOf("userIds") && (
            <FormHelperText data-error-for="userIds" error>
              {errorOf("userIds")}
            </FormHelperText>
          )}
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

export default GembaWalkObserversFormPage;
