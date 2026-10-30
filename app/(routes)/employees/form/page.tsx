"use client";

export const dynamic = "force-dynamic";

import { ChangeEvent, useState } from "react";

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
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormContainer from "@shared/components/FormContainer";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";
import { NUMERIC_INPUT } from "@shared/utils/inputModes";

const LIST_HREF = "/employees";

// Campos del API con otro nombre en el formulario.
const EMPLOYEE_API_FIELDS = {
  areaId: "area",
  positionId: "position",
  manufacturingPlantsIds: "manufacturingPlantNames",
  genderId: "gender",
};

interface EmployeeForm {
  code: string;
  name: string;
  birthdate: Dayjs | null;
  dateOfAdmission: Dayjs | null;
  area: string;
  position: string;
  gender: string;
  manufacturingPlantNames: string[];
}

const EMPTY_FORM: EmployeeForm = {
  code: "",
  name: "",
  birthdate: null,
  dateOfAdmission: null,
  area: "",
  position: "",
  gender: "",
  manufacturingPlantNames: [],
};

// Fecha obligatoria: vacía o incompleta ("Invalid Date" mientras se escribe).
const dateError = (date: Dayjs | null, label: string) =>
  !date
    ? `Escribe la fecha de ${label}.`
    : !date.isValid()
      ? `La fecha de ${label} no es válida.`
      : undefined;

const EmployeesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data: catalogs } = useEmployeeCatalogs();
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(idCurrent, EmployeesService.findOne, (data) => {
    const loaded = {
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
    };
    setForm(loaded);
    leave.markPristine(loaded);
  });

  const save = () => {
    const codeClean = form.code.trim();
    const nameClean = form.name.trim();
    const birthdateClean = form.birthdate;
    const dateOfAdmissionClean = form.dateOfAdmission;
    const areaClean = form.area;
    const positionClean = form.position;
    const manufacturingPlantNamesClean = form.manufacturingPlantNames;

    // Todo lo que falta, en el orden de la pantalla. Mismas reglas que antes
    // deshabilitaban "Guardar" (el género no se marcaba en ningún lado).
    if (
      failAll({
        code: !codeClean ? "Escribe el código." : undefined,
        name: !nameClean ? "Escribe el nombre completo." : undefined,
        birthdate: dateError(birthdateClean, "nacimiento"),
        gender: !form.gender ? "Selecciona el género." : undefined,
        dateOfAdmission: dateError(dateOfAdmissionClean, "admisión"),
        manufacturingPlantNames: !manufacturingPlantNamesClean.length
          ? "Selecciona al menos una planta."
          : undefined,
        area: !areaClean ? "Selecciona el área." : undefined,
        position: !positionClean ? "Selecciona el puesto." : undefined,
      }) ||
      !birthdateClean ||
      !dateOfAdmissionClean
    ) {
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
          router.push(LIST_HREF);
        })
        .catch((error) => failFromApi(error, EMPLOYEE_API_FIELDS))
        .finally(() => setIsLoading(false));
    } else {
      EmployeesService.update(idCurrent, payload)
        .then(() => {
          toast.success("Colaborador actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch((error) => failFromApi(error, EMPLOYEE_API_FIELDS))
        .finally(() => setIsLoading(false));
    }
  };

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

  const title = idCurrent ? "Editar colaborador" : "Nuevo colaborador";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Colaborador no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <FormContainer>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
      <FormSection
        title="Datos personales"
        description="Cómo se identifica al colaborador."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...fieldProps("code")}
            // Si hay error se muestra el error; si no, la ayuda.
            helperText={errorOf("code") ?? "Solo números"}
            required
            label="Código de colaborador"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.code}
            onChange={onChangeSelect}
            name="code"
            slotProps={{ htmlInput: NUMERIC_INPUT }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
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
              <FormHelperText data-error-for="birthdate" error>
                {errorOf("birthdate")}
              </FormHelperText>
            )}
          </LocalizationProvider>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SelectDefault
            data={catalogs?.genres || []}
            label="Género *"
            value={form.gender}
            onChange={onChangeSelect}
            name="gender"
          />
          {errorOf("gender") && (
            <FormHelperText data-error-for="gender" error>
              {errorOf("gender")}
            </FormHelperText>
          )}
        </Grid>
      </FormSection>
      <FormSection
        title="Datos laborales"
        description="Dónde trabaja y desde cuándo."
      >
        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <SelectDefault
            data={catalogs?.areas || []}
            label="Área *"
            value={form.area}
            onChange={onChangeSelect}
            name="area"
          />
          {errorOf("area") && (
            <FormHelperText data-error-for="area" error>
              {errorOf("area")}
            </FormHelperText>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <SelectDefault
            data={catalogs?.positions || []}
            label="Puesto *"
            value={form.position}
            onChange={onChangeSelect}
            name="position"
          />
          {errorOf("position") && (
            <FormHelperText data-error-for="position" error>
              {errorOf("position")}
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
    </FormContainer>
  );
};

export default EmployeesFormPage;
