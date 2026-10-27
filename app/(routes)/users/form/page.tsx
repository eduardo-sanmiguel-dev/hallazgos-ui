"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { TextField } from "@mui/material";
import { toast } from "sonner";
import { FormHelperText } from "@mui/material";
import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { FormControl } from "@mui/material";
import { Select, SelectChangeEvent } from "@mui/material";
import { IconButton } from "@mui/material";
import { InputAdornment } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { UsersService } from "@services";
import MultiSelectManufacturingPlants from "@components/MultiSelectManufacturingPlants";
import MultiSelectZones from "@components/MultiSelectZones";
import { isValidEmail } from "@shared/utils";
import MultiSelectProcesses from "@components/MultiSelectProcesses";
import { useFieldErrors } from "@hooks/useFieldErrors";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";

const UsersFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    rule: string;
    manufacturingPlantNames: string[];
    zoneNames: string[];
    processNames: string[];
  }>({
    name: "",
    email: "",
    password: "",
    rule: "",
    manufacturingPlantNames: [],
    zoneNames: [],
    processNames: [],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fail, failFromApi, errorOf, fieldProps } = useFieldErrors<
    | "name"
    | "email"
    | "password"
    | "manufacturingPlantNames"
    | "zoneNames"
  >(form);

  const save = () => {
    const nameClean = form.name.trim();
    const emailClean = form.email.trim();
    const passwordClean = form.password.trim();

    if (!nameClean) {
      fail("name", "El nombre es requerido");
      return;
    }

    if (!emailClean) {
      fail("email", "El correo electrónico es requerido");
      return;
    }

    if (!isValidEmail(emailClean)) {
      fail("email", "El correo electrónico no es válido");
      return;
    }

    if (!idCurrent && !passwordClean) {
      fail("password", "La contraseña es requerida");
      return;
    }

    if (!form.manufacturingPlantNames.length) {
      fail("manufacturingPlantNames", "La planta de manufactura es requerida");
      return;
    }

    if (form.rule === "Supervisor" && !form.zoneNames.length) {
      fail("zoneNames", "La zona es requerida");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: nameClean,
      email: emailClean,
      password: passwordClean,
      rule: form.rule,
      manufacturingPlantNames: form.manufacturingPlantNames,
      zoneNames: form.rule === "Supervisor" ? form.zoneNames : [],
      processNames: form.rule === "Supervisor" ? form.processNames : [],
    };

    if (!idCurrent) {
      UsersService.create(payload)
        .then(() => {
          toast.success("Usuario creado correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      UsersService.update(idCurrent, payload)
        .then(() => {
          toast.success("Usuario actualizado correctamente");
          cancel();
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const cancel = () => {
    router.push("/users");
  };

  const isValidateForm = useMemo(
    () =>
      !form.name?.trim() ||
      !form.email?.trim() ||
      (!idCurrent && !form.password?.trim()) ||
      !form.rule?.trim() ||
      !form.manufacturingPlantNames?.length,
    [form, idCurrent],
  );

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    UsersService.findOne(id).then((data) => {
      const zoneNames =
        data.role === "Supervisor"
          ? data.zones.map(
              (zone) => `${zone.manufacturingPlant.name} - ${zone.name}`,
            )
          : [];

      const processNames =
        data.role === "Supervisor"
          ? data.processes.map(
              (process) =>
                `${process.manufacturingPlant.name} - ${process.name}`,
            )
          : [];

      setForm({
        name: data.name,
        email: data.email,
        password: "",
        rule: data.role,
        manufacturingPlantNames: data.manufacturingPlants.map(
          (plant) => plant.name,
        ),
        zoneNames,
        processNames,
      });
    });
  }, [searchParams]);

  return (
    <>
      <PageHeader title={idCurrent ? "Editar usuario" : "Nuevo usuario"} />
      <FormSection>
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
            md: 3,
          }}
        >
          <TextField
            {...fieldProps("email")}
            required
            label="Correo electrónico"
            variant="outlined"
            fullWidth
            autoComplete="off"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
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
            {...fieldProps("password")}
            required={!idCurrent}
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            autoComplete="new-password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={showPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="rule-select-label">Rol</InputLabel>
            <Select
              labelId="rule-select-label"
              id="rule-select"
              value={form.rule}
              label="Rol"
              onChange={(e: SelectChangeEvent) =>
                setForm({
                  ...form,
                  rule: e.target.value as string,
                })
              }
            >
              <MenuItem value="Administrador">Administrador</MenuItem>
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Supervisor">Supervisor</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {form.rule && (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
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
        )}

        {form.rule === "Supervisor" &&
          !!form.manufacturingPlantNames.length && (
            <>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <MultiSelectZones
                  values={form.zoneNames}
                  onChange={(values) => {
                    setForm({
                      ...form,
                      zoneNames: values,
                    });
                  }}
                  manufacturingPlantNames={form.manufacturingPlantNames}
                />
                {errorOf("zoneNames") && (
                  <FormHelperText data-error-for="zoneNames" error>{errorOf("zoneNames")}</FormHelperText>
                )}
              </Grid>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4,
                }}
              >
                <MultiSelectProcesses
                  values={form.processNames}
                  onChange={(values) => {
                    setForm({
                      ...form,
                      processNames: values,
                    });
                  }}
                  manufacturingPlantNames={form.manufacturingPlantNames}
                />
              </Grid>
            </>
          )}
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

export default UsersFormPage;

