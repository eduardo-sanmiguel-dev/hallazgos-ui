"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import { GembaWalkObserversService, UsersService } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import { useCatalog, useGembaWalkZones } from "@hooks";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

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
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, failFromApi, errorOf } = useFieldErrors<
    | "manufacturingPlantId"
    | "gembaWalkZoneId"
    | "userIds"
  >(form);

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const gembaWalkZoneId = Number(form.gembaWalkZoneId);
    const userIds = form.userIds.map(Number);

    if (!manufacturingPlantId) {
      fail("manufacturingPlantId", "La planta es requerida");
      return;
    }

    if (!gembaWalkZoneId) {
      fail("gembaWalkZoneId", "La zona es requerida");
      return;
    }

    if (!userIds.length) {
      fail("userIds", "El usuario es requerido");
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
          cancel();
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
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/gemba-walk/observers");
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.gembaWalkZoneId ||
      !form.userIds.length,
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    GembaWalkObserversService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: `${data.manufacturingPlant?.id || ""}`,
        gembaWalkZoneId: `${data.gembaWalkZone?.id || ""}`,
        userIds: data.user ? [`${data.user.id}`] : [],
      });
    });
  }, [searchParams]);

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

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar observador" : "Nuevo observador"}
      />
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
            validationEmpty
          />
          {errorOf("gembaWalkZoneId") && (
            <FormHelperText data-error-for="gembaWalkZoneId" error>{errorOf("gembaWalkZoneId")}</FormHelperText>
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
              validationEmpty
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
              validationEmpty
            />
          )}
          {errorOf("userIds") && (
            <FormHelperText data-error-for="userIds" error>{errorOf("userIds")}</FormHelperText>
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

export default GembaWalkObserversFormPage;
