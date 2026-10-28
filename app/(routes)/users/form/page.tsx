"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

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
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useLeaveConfirm } from "@hooks/useLeaveConfirm";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import EditRecordState from "@shared/components/EditRecordState";

const LIST_HREF = "/users";

interface UserForm {
  name: string;
  email: string;
  password: string;
  rule: string;
  manufacturingPlantNames: string[];
  zoneNames: string[];
  processNames: string[];
}

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  password: "",
  rule: "",
  manufacturingPlantNames: [],
  zoneNames: [],
  processNames: [],
};

const UsersFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);

  const router = useRouter();
  const searchParams = useSearchParams();
  const idCurrent = Number(searchParams.get("id") || 0);

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);
  const leave = useLeaveConfirm(form, { isEditing: !!idCurrent });

  const record = useEditRecord(idCurrent, UsersService.findOne, (data) => {
    const zoneNames =
      data.role === "Supervisor"
        ? data.zones.map(
            (zone) => `${zone.manufacturingPlant.name} - ${zone.name}`,
          )
        : [];

    const processNames =
      data.role === "Supervisor"
        ? data.processes.map(
            (process) => `${process.manufacturingPlant.name} - ${process.name}`,
          )
        : [];

    const loaded = {
      name: data.name,
      email: data.email,
      password: "",
      rule: data.role,
      manufacturingPlantNames: data.manufacturingPlants.map(
        (plant) => plant.name,
      ),
      zoneNames,
      processNames,
    };
    setForm(loaded);
    leave.markPristine(loaded);
  });

  const save = () => {
    const nameClean = form.name.trim();
    const emailClean = form.email.trim();
    const passwordClean = form.password.trim();

    // Todo lo que falta, en el orden de la pantalla. Mismas reglas que antes
    // (el rol deshabilitaba "Guardar" sin decir nada). Las plantas y las
    // zonas aparecen al elegir el rol: solo se marcan si están en pantalla.
    if (
      failAll({
        name: !nameClean ? "Escribe el nombre." : undefined,
        email: !emailClean
          ? "Escribe el correo electrónico."
          : !isValidEmail(emailClean)
            ? "El correo electrónico no es válido."
            : undefined,
        password:
          !idCurrent && !passwordClean ? "Escribe la contraseña." : undefined,
        rule: !form.rule ? "Selecciona el rol." : undefined,
        manufacturingPlantNames:
          form.rule && !form.manufacturingPlantNames.length
            ? "Selecciona al menos una planta."
            : undefined,
        zoneNames:
          form.rule === "Supervisor" &&
          form.manufacturingPlantNames.length &&
          !form.zoneNames.length
            ? "Selecciona al menos una zona."
            : undefined,
      })
    ) {
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
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    } else {
      UsersService.update(idCurrent, payload)
        .then(() => {
          toast.success("Usuario actualizado correctamente");
          router.push(LIST_HREF);
        })
        .catch(failFromApi)
        .finally(() => setIsLoading(false));
    }
  };

  const title = idCurrent ? "Editar usuario" : "Nuevo usuario";

  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title={title}
        notFoundTitle="Usuario no encontrado"
        listHref={LIST_HREF}
      />
    );
  }

  return (
    <>
      <PageHeader title={title} breadcrumbs onNavigate={leave.go} />
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
            // Teclado de correo (con @) y sin mayúscula inicial.
            slotProps={{
              htmlInput: { inputMode: "email", autoCapitalize: "none" },
            }}
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
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
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
          <FormControl fullWidth error={!!errorOf("rule")}>
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
            {errorOf("rule") && (
              <FormHelperText data-error-for="rule" error>
                {errorOf("rule")}
              </FormHelperText>
            )}
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
                  <FormHelperText data-error-for="zoneNames" error>
                    {errorOf("zoneNames")}
                  </FormHelperText>
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
        onCancel={() => leave.go(LIST_HREF)}
        onSave={save}
        isSaving={isLoading}
      />
      {leave.confirmDialog}
    </>
  );
};

export default UsersFormPage;
