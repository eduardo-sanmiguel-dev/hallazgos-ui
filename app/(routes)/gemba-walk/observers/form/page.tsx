"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";

import {
  GembaWalkObserversService,
  UsersService,
  GembaWalkZonesService,
} from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";

interface Option {
  id: number;
  name: string;
}

const GembaWalkObserversFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<Option[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
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

  const save = () => {
    const manufacturingPlantId = Number(form.manufacturingPlantId);
    const gembaWalkZoneId = Number(form.gembaWalkZoneId);
    const userIds = form.userIds.map(Number);

    if (!manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    if (!gembaWalkZoneId) {
      toast.error("La zona es requerida");
      return;
    }

    if (!userIds.length) {
      toast.error("El usuario es requerido");
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

  useEffect(() => {
    setZones([]);
    setUsers([]);

    if (!form.manufacturingPlantId) return;

    GembaWalkZonesService.findAll({
      manufacturingPlantId: form.manufacturingPlantId,
    }).then((data) =>
      setZones(
        data.map((zone) => ({
          id: zone.id,
          name: `${zone.nameZone} - ${zone.nameLocation}`,
        })),
      ),
    );

    UsersService.findAll({
      manufacturingPlantId: form.manufacturingPlantId,
    }).then((data) =>
      setUsers(
        data.map((user) => ({
          id: user.id,
          name: `${user.name} - ${user.email}`,
        })),
      ),
    );
  }, [form.manufacturingPlantId]);

  return (
    <Grid container spacing={2}>
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
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 2.5,
        }}
      >
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<CloseIcon />}
          onClick={cancel}
        >
          Cancelar
        </Button>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 6,
          md: 2.5,
        }}
      >
        <Button
          loading={isLoading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
          color="primary"
          fullWidth
          onClick={save}
          disabled={isValidateForm || isLoading}
        >
          Guardar
        </Button>
      </Grid>
    </Grid>
  );
};

export default GembaWalkObserversFormPage;
