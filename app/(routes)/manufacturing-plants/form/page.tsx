"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";

import { ManufacturingPlantsService } from "@services";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const ManufacturingPlantsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: "",
    link: "",
    lat: "",
    lng: "",
  });
  const [idCurrent, setIdCurrent] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, failFromApi, fieldProps } = useFieldErrors<
    | "name"
    | "link"
    | "lat"
    | "lng"
  >(form);

  const save = () => {
    const nameClean = form.name.trim();
    const linkClean = form.link.trim();
    const latClean = form.lat.trim();
    const lngClean = form.lng.trim();

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!linkClean) {
      fail("link", "El link es requerido");
      return;
    }

    if (!latClean) {
      fail("lat", "La latitud es requerida");
      return;
    }

    if (!lngClean) {
      fail("lng", "La longitud es requerida");
      return;
    }

    setIsLoading(true);

    if (!idCurrent) {
      ManufacturingPlantsService.create({
        name: nameClean,
        link: linkClean,
        lat: Number(latClean),
        lng: Number(lngClean),
      })
        .then(() => {
          toast.success("Planta creada correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      ManufacturingPlantsService.update(idCurrent, {
        name: nameClean,
        link: linkClean,
        lat: Number(latClean),
        lng: Number(lngClean),
      })
        .then(() => {
          toast.success("Planta actualizada correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/manufacturing-plants");
  };

  const isValidateForm = useMemo(
    () =>
      !form.name?.trim() ||
      !form.link?.trim() ||
      !form.lat?.trim() ||
      !form.lng?.trim(),
    [form]
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    ManufacturingPlantsService.findOne(id).then((data) => {
      setForm({
        name: data.name,
        link: data.link,
        lat: data.lat.toString(),
        lng: data.lng.toString(),
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar planta" : "Nueva planta"} />
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
          <TextField
            {...fieldProps("link")}
            required
            label="Link"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.link}
            onChange={(e) =>
              setForm({
                ...form,
                link: e.target.value,
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
          <TextField
            {...fieldProps("lat")}
            required
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Latitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lat}
            onChange={(e) =>
              setForm({
                ...form,
                lat: e.target.value,
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
          <TextField
            {...fieldProps("lng")}
            required
            type="number"
            onKeyDown={(evt) => evt.key === "e" && evt.preventDefault()}
            label="Longitud"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.lng}
            onChange={(e) =>
              setForm({
                ...form,
                lng: e.target.value,
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

export default ManufacturingPlantsFormPage;

