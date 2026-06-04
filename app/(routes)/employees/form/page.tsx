"use client";

export const dynamic = "force-dynamic";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { EmployeesService } from "@services";
import { CatalogEmployee } from "@interfaces";
import SelectDefault from "@components/SelectDefault";
import { SelectChangeEvent } from "@mui/material";
import MultiSelectManufacturingPlants from "@components/MultiSelectManufacturingPlants";

const EmployeesFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const [catalogs, setCatalogs] = useState<CatalogEmployee | null>(null);
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

  useEffect(() => {
    EmployeesService.catalogs().then((data) => setCatalogs(data));
  }, []);

  const save = () => {
    const codeClean = form.code.trim();
    const nameClean = form.name.trim();
    const birthdateClean = form.birthdate;
    const dateOfAdmissionClean = form.dateOfAdmission;
    const areaClean = form.area;
    const positionClean = form.position;
    const manufacturingPlantNamesClean = form.manufacturingPlantNames;

    if (!codeClean) {
      toast.error("El código es requerido");
      return;
    }

    if (!nameClean) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!birthdateClean) {
      toast.error("La fecha de nacimiento es requerida");
      return;
    }

    if (!birthdateClean.isValid()) {
      toast.error("La fecha de nacimiento no es válida");
      return;
    }

    if (!dateOfAdmissionClean) {
      toast.error("La fecha de admisión es requerida");
      return;
    }

    if (!dateOfAdmissionClean.isValid()) {
      toast.error("La fecha de admisión no es válida");
      return;
    }

    if (!areaClean) {
      toast.error("El área es requerida");
      return;
    }

    if (!positionClean) {
      toast.error("El puesto es requerido");
      return;
    }

    if (!manufacturingPlantNamesClean.length) {
      toast.error("Seleccione al menos una planta");
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
      <Grid container spacing={2}>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Paper>
            <TextField
              label="Código de empleado *"
              variant="outlined"
              fullWidth
              autoComplete="off"
              value={form.code}
              onChange={onChangeSelect}
              name="code"
            />
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Paper>
            <TextField
              label="Nombre completo *"
              variant="outlined"
              fullWidth
              autoComplete="off"
              value={form.name}
              onChange={onChangeSelect}
              name="name"
            />
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Paper>
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
                  } as any,
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <Paper>
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
                  } as any,
                }}
              />
            </LocalizationProvider>
          </Paper>
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
          <Paper>
            <MultiSelectManufacturingPlants
              values={form.manufacturingPlantNames}
              onChange={(values) => {
                setForm({
                  ...form,
                  manufacturingPlantNames: values,
                });
              }}
            />
          </Paper>
        </Grid>
      </Grid>
      <Grid
        container
        spacing={2}
        sx={{ marginTop: 2, alignContent: "center", justifyContent: "center" }}
      >
        <Grid
          size={{
            xs: 12,
            sm: 3,
            md: 3,
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
            sm: 3,
            md: 3,
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
    </>
  );
};

export default EmployeesFormPage;

