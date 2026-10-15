"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import { EmergencyTeamsService } from "@services";
import { ExtinguisherType } from "@interfaces";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const extinguisherTypes = [
  ExtinguisherType.PQS,
  ExtinguisherType.CO2,
  ExtinguisherType.AFFF,
  ExtinguisherType.EXTINTOR_TIPO_D,
  ExtinguisherType.EXTINTOR_DE_SOLKAFLAN,
];

const EmergencyTeamsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    manufacturingPlantId: "",
    location: "",
    extinguisherNumber: "",
    typeOfExtinguisher: "" as ExtinguisherType | "",
    capacity: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "manufacturingPlantId"
    | "location"
    | "extinguisherNumber"
    | "capacity"
    | "typeOfExtinguisher"
  >(form);

  const save = () => {
    const locationClean = form.location.trim();
    const extinguisherNumberClean = form.extinguisherNumber.trim();
    const capacityClean = form.capacity.trim();

    if (!form.manufacturingPlantId) {
      fail("manufacturingPlantId", "La planta es requerida");
      return;
    }

    if (!locationClean) {
      fail("location", "La ubicación es requerida");
      return;
    }

    if (!extinguisherNumberClean) {
      fail("extinguisherNumber", "El número de extintor es requerido");
      return;
    }

    if (!capacityClean) {
      fail("capacity", "La capacidad es requerida");
      return;
    }

    if (!form.typeOfExtinguisher) {
      fail("typeOfExtinguisher", "El tipo de extintor es requerido");
      return;
    }

    setIsLoading(true);

    const payload = {
      location: locationClean,
      extinguisherNumber: extinguisherNumberClean,
      typeOfExtinguisher: form.typeOfExtinguisher as ExtinguisherType,
      capacity: Number(capacityClean),
      manufacturingPlantId: Number(form.manufacturingPlantId),
    };

    if (!idCurrent) {
      EmergencyTeamsService.create(payload)
        .then(() => {
          toast.success("Equipo de emergencia creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      EmergencyTeamsService.update(idCurrent, payload)
        .then(() => {
          toast.success("Equipo de emergencia actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/emergency-teams");
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.location?.trim() ||
      !form.extinguisherNumber?.trim() ||
      !form.typeOfExtinguisher ||
      !form.capacity?.trim(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    EmergencyTeamsService.findOne(id).then((data) => {
      setForm({
        manufacturingPlantId: data.manufacturingPlant?.id?.toString() || "",
        location: data.location,
        extinguisherNumber: data.extinguisherNumber.toString(),
        typeOfExtinguisher: data.typeOfExtinguisher,
        capacity: data.capacity.toString(),
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar equipo de emergencia" : "Nuevo equipo de emergencia"}
      />
      <FormSection>
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
          <TextField
            {...fieldProps("location")}
            required
            label="Ubicación"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.location}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                location: e.target.value,
              })
            }
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <TextField
            {...fieldProps("extinguisherNumber")}
            required
            label="Núm. Extintor"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.extinguisherNumber}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                extinguisherNumber: e.target.value.replace(
                  /[^a-zA-Z0-9-]/g,
                  "",
                ),
              })
            }
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <TextField
            {...fieldProps("typeOfExtinguisher")}
            required
            select
            label="Tipo de extintor"
            variant="outlined"
            fullWidth
            value={form.typeOfExtinguisher}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                typeOfExtinguisher: e.target.value as ExtinguisherType | "",
              })
            }
          >
            <MenuItem value="">Seleccione</MenuItem>
            {extinguisherTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <TextField
            {...fieldProps("capacity")}
            required
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Capacidad"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.capacity}
            disabled={!form.manufacturingPlantId}
            onChange={(e) =>
              setForm({
                ...form,
                capacity: e.target.value,
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

export default EmergencyTeamsFormPage;
