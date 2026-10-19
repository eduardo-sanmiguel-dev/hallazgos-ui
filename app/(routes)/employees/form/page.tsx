"use client";


export const dynamic = "force-dynamic";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { useEmployeeCatalogs } from "@hooks";
import { EmployeesService } from "@services";
import SelectDefault from "@components/SelectDefault";
import { SelectChangeEvent } from "@mui/material";
import MultiSelectManufacturingPlants from "@components/MultiSelectManufacturingPlants";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const EmployeesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const { data: catalogs } = useEmployeeCatalogs();
  const [form, setForm] = useState<{
    code: string;
    name: string;
    birthdate: Dayjs | null;
    dateOfAdmission: Dayjs | null;
    area: string;
    position: string;
    gender: string;
    manufacturingPlantNames: string[];
  }>({
    code: "",
    name: "",
    birthdate: null,
    dateOfAdmission: null,
    area: "",
    position: "",
    gender: "",
    manufacturingPlantNames: [],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, errorOf, fieldProps } = useFieldErrors<
    | "code"
    | "name"
    | "birthdate"
    | "dateOfAdmission"
    | "area"
    | "position"
    | "manufacturingPlantNames"
  >(form);

  const save = () => {
    const codeClean = form.code.trim();
    const nameClean = form.name.trim();
    const birthdateClean = form.birthdate;
    const dateOfAdmissionClean = form.dateOfAdmission;
    const areaClean = form.area;
    const positionClean = form.position;
    const manufacturingPlantNamesClean = form.manufacturingPlantNames;

    if (!codeClean) {
      fail("code", "El código es requerido");
      return;
    }

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!birthdateClean) {
      fail("birthdate", "La fecha de nacimiento es requerida");
      return;
    }

    if (!birthdateClean.isValid()) {
      fail("birthdate", "La fecha de nacimiento no es válida");
      return;
    }

    if (!dateOfAdmissionClean) {
      fail("dateOfAdmission", "La fecha de admisión es requerida");
      return;
    }

    if (!dateOfAdmissionClean.isValid()) {
      fail("dateOfAdmission", "La fecha de admisión no es válida");
      return;
    }

    if (!areaClean) {
      fail("area", "El área es requerida");
      return;
    }

    if (!positionClean) {
      fail("position", "El puesto es requerido");
      return;
    }

    if (!manufacturingPlantNamesClean.length) {
      fail("manufacturingPlantNames", "Seleccione al menos una planta");
      return;
    }

    setIsLoading(true);

    const payload = {
      code: codeClean,
      name: nameClean,
      birthdate: birthdateClean.toISOString(),
      dateOfAdmission: dateOfAdmissionClean.toISOString(),
      areaId: areaClean,
      positionId: positionClean,
      genderId: form.gender,
      manufacturingPlantsIds:
        catalogs?.manufacturingPlants
          .filter((mp) => manufacturingPlantNamesClean.includes(mp.name))
          .map((mp) => mp.id) || [],
    };

    if (!idCurrent) {
      EmployeesService.create(payload)
        .then(() => {
          toast.success("Colaborador creado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } else {
      EmployeesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Colaborador actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/employees");
  };

  const isValidateForm = useMemo(
    () =>
      !form.code?.trim() ||
      !form.name?.trim() ||
      !form.birthdate ||
      !form.dateOfAdmission ||
      !form.area ||
      !form.position ||
      !form.gender ||
      !form.manufacturingPlantNames.length ||
      !form.birthdate.isValid() ||
      !form.dateOfAdmission.isValid(),
    [form],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    EmployeesService.findOne(id).then((data) => {
      setForm({
        code: `${data.code}`,
        name: data.name,
        birthdate: data.birthdate ? dayjs(data.birthdate) : null,
        dateOfAdmission: data.dateOfAdmission
          ? dayjs(data.dateOfAdmission)
          : null,
        area: data.area?.id ? `${data.area.id}` : "",
        position: data.position?.id ? `${data.position.id}` : "",
        gender: data.gender?.id ? `${data.gender.id}` : "",
        manufacturingPlantNames: data.manufacturingPlants.map((mp) => mp.name),
      });
    });
  }, [searchParams]);

  const onChangeSelect = (
    event:
      | SelectChangeEvent<string>
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar colaborador" : "Nuevo colaborador"}
      />
      <FormSection>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <TextField
            {...fieldProps("code")}
            // Si hay error se muestra el error; si no, la ayuda.
            helperText={errorOf("code") ?? "Solo números"}
            required
            label="Código de empleado"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.code}
            onChange={onChangeSelect}
            name="code"
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
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
            {...fieldProps("name")}
            required
            label="Nombre completo"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.name}
            onChange={onChangeSelect}
            name="name"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="es"
            localeText={
              esES.components.MuiLocalizationProvider.defaultProps.localeText
            }
          >
            <DatePicker
              label="Fecha de nacimiento *"
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              value={form.birthdate}
              onChange={(newValue: Dayjs | null) =>
                setForm({ ...form, birthdate: newValue })
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
            {errorOf("birthdate") && (
              <FormHelperText data-error-for="birthdate" error>{errorOf("birthdate")}</FormHelperText>
            )}
          </LocalizationProvider>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="es"
            localeText={
              esES.components.MuiLocalizationProvider.defaultProps.localeText
            }
          >
            <DatePicker
              label="Fecha de admisión *"
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              value={form.dateOfAdmission}
              onChange={(newValue: Dayjs | null) =>
                setForm({ ...form, dateOfAdmission: newValue })
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
            {errorOf("dateOfAdmission") && (
              <FormHelperText data-error-for="dateOfAdmission" error>
                {errorOf("dateOfAdmission")}
              </FormHelperText>
            )}
          </LocalizationProvider>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={catalogs?.areas || []}
            label="Area *"
            value={form.area}
            onChange={onChangeSelect}
            name="area"
          />
          {errorOf("area") && (
            <FormHelperText data-error-for="area" error>{errorOf("area")}</FormHelperText>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={catalogs?.positions || []}
            label="Puesto *"
            value={form.position}
            onChange={onChangeSelect}
            name="position"
          />
          {errorOf("position") && (
            <FormHelperText data-error-for="position" error>{errorOf("position")}</FormHelperText>
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={catalogs?.genres || []}
            label="Género *"
            value={form.gender}
            onChange={onChangeSelect}
            name="gender"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <MultiSelectManufacturingPlants
            values={form.manufacturingPlantNames}
            onChange={(values) => {
              setForm({
                ...form,
                manufacturingPlantNames: values,
              });
            }}
          />
          {errorOf("manufacturingPlantNames") && (
            <FormHelperText data-error-for="manufacturingPlantNames" error>
              {errorOf("manufacturingPlantNames")}
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

export default EmployeesFormPage;

