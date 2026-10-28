"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { FormHelperText } from "@mui/material";
import { Checkbox } from "@mui/material";
import { Autocomplete } from "@mui/material";
import { TextField } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { v4 as uuidv4 } from "uuid";

import {
  EMPTY_CATALOG,
  useCatalog,
  useIcsCatalogs,
  useUploadProgress,
} from "@hooks";
import { EmployeesService, IcsService } from "@services";
import SelectDefault from "@components/SelectDefault";
import { useUserSessionStore } from "@store";
import { NUMERIC_INPUT } from "@shared/utils/inputModes";
import ImageORCamera from "@shared/components/ImageORCamera";
import { dataURLtoFile, notify } from "@shared/utils";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
import { useFormDraft } from "@hooks/useFormDraft";
import { isDraftStorageAvailable } from "@shared/drafts/draftStore";
import PageHeader from "@shared/components/PageHeader";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import DraftNotice from "@shared/components/DraftNotice";
import ErrorState from "@shared/components/ErrorState";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";

// Lo que se captura (y se guarda en el borrador local; la foto va aparte).
interface IcsForm {
  manufacturingPlant: string;
  ruleOfLife: string;
  standardOfBehavior: string;
  areaOfBehavior: string;
  totalPeople: string;
  employees: string[];
  description: string;
}

type IcsField = keyof IcsForm;

const EMPTY_FORM: IcsForm = {
  manufacturingPlant: "",
  ruleOfLife: "",
  standardOfBehavior: "",
  areaOfBehavior: "",
  totalPeople: "",
  employees: [],
  description: "",
};

// Campos del API → campos del formulario (employeesIds.0 → employees). La
// foto (file) queda solo en el aviso.
const ICS_API_FIELDS: Record<string, IcsField | null> = {
  manufacturingPlantId: "manufacturingPlant",
  ruleOfLifeId: "ruleOfLife",
  standardOfBehaviorId: "standardOfBehavior",
  areaOfBehaviorId: "areaOfBehavior",
  totalPeople: "totalPeople",
  employeesIds: "employees",
  description: "description",
  file: null,
};

const icsApiField = (path: string) =>
  ICS_API_FIELDS[path.split(".")[0]] ?? null;

// La planta sola no cuenta: es lo primero que se elige y no vale un borrador.
const hasCapture = (form: IcsForm, photo: File | null) =>
  !!photo ||
  [
    form.ruleOfLife,
    form.totalPeople,
    form.description.trim(),
    form.employees.length,
  ].some(Boolean);

/** Mensaje de error bajo un select (lo encuentra useFieldErrors para el foco). */
const FieldError = ({ field, message }: { field: string; message?: string }) =>
  message ? (
    <FormHelperText data-error-for={field} error>
      {message}
    </FormHelperText>
  ) : null;

const IcsFormPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const [image, setImage] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [form, setForm] = useState<IcsForm>(EMPTY_FORM);
  const upload = useUploadProgress();
  const { confirm, confirmDialog } = useConfirmDialog();

  const catalogsQuery = useIcsCatalogs();
  const catalogs = catalogsQuery.data ?? EMPTY_CATALOG;

  // Colaboradores de la planta elegida (misma consulta que CIAEL).
  const employeesQuery = useCatalog(
    "employees",
    () =>
      EmployeesService.findAll({
        manufacturingPlantId: Number(form.manufacturingPlant),
      }),
    {
      enabled: !!form.manufacturingPlant,
      params: { manufacturingPlantId: form.manufacturingPlant },
    },
  );
  const employees = employeesQuery.data ?? EMPTY_CATALOG;

  const router = useRouter();
  const searchParams = useSearchParams();

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  // Borrador local (C3), como en Hallazgos: lo capturado y la foto quedan en
  // el dispositivo hasta enviarse. En edición (?id=) no aplica.
  const draft = useFormDraft<IcsForm>({
    form: idCurrent ? null : "ics",
    content: { fields: form, photo: attachedFile },
    hasContent: ({ fields, photo }) => hasCapture(fields, photo),
    onRestore: ({ fields, photo }) => {
      setForm(fields);
      setImage("");
      setAttachedFile(photo);
    },
  });
  const isLocked = !!draft.lock;

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);

  const standards =
    catalogs.find((cat) => Number(cat.id) === Number(form.ruleOfLife))
      ?.standards || [];
  const areas =
    standards.find((cat) => Number(cat.id) === Number(form.standardOfBehavior))
      ?.areas || [];

  // Al cambiar un campo se limpian los que dependen de él. Antes lo hacían
  // efectos, que también borraban lo recuperado de un borrador.
  const changeField = <K extends IcsField>(name: K, value: IcsForm[K]) =>
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "manufacturingPlant" && { employees: [] }),
      ...(name === "ruleOfLife" && {
        standardOfBehavior: "",
        areaOfBehavior: "",
      }),
      ...(name === "standardOfBehavior" && { areaOfBehavior: "" }),
    }));

  // Todo lo que falta, en el orden de la pantalla. Mismas reglas que antes
  // deshabilitaban "Guardar".
  const missingFields = (): Partial<Record<IcsField, string>> => {
    const totalPeople = Number(form.totalPeople.trim());
    const selected = form.employees.length;
    return {
      manufacturingPlant: !form.manufacturingPlant
        ? "Selecciona la planta."
        : undefined,
      ruleOfLife: !form.ruleOfLife ? "Selecciona la regla de vida." : undefined,
      totalPeople: !form.totalPeople.trim()
        ? "Escribe cuántas personas observaste."
        : selected && totalPeople < selected
          ? `No puede ser menor que las personas que no cumplen con el estándar (${selected}).`
          : undefined,
      employees: !selected
        ? "Selecciona al menos una persona que no cumple."
        : undefined,
    };
  };

  const save = () => {
    if (failAll(missingFields())) return;
    send();
  };

  // También es "Reintentar envío" de un borrador en solo lectura: mismos
  // datos y misma clave.
  const send = async () => {
    // La edición nunca se implementó (ver el bloque comentado al final).
    if (idCurrent) return;

    const formData = new FormData();

    formData.append("manufacturingPlantId", form.manufacturingPlant);
    formData.append("totalPeople", form.totalPeople.trim());
    formData.append("ruleOfLifeId", form.ruleOfLife);
    if (form.standardOfBehavior) {
      formData.append("standardOfBehaviorId", form.standardOfBehavior);
    }
    if (form.areaOfBehavior) {
      formData.append("areaOfBehaviorId", form.areaOfBehavior);
    }
    const descriptionClean = form.description.trim();
    if (descriptionClean) {
      formData.append("description", descriptionClean);
    }

    form.employees.forEach((id, idx) =>
      formData.append(`employeesIds[${idx}]`, String(Number(id))),
    );

    const uuid = uuidv4();

    if (image) {
      formData.append("file", dataURLtoFile(image, `${uuid}-evidence.png`));
    } else if (attachedFile) {
      const extension = attachedFile.name.split(".").pop();

      const nameWithUuid = `${uuid}-evidence.${extension}`;

      formData.append("file", attachedFile, nameWithUuid);
    }

    setIsLoading(true);
    // Antes de enviar queda como envío pendiente en el borrador, con su clave:
    // si se pierde la señal o se cierra la app, reenviarlo no duplica.
    await draft.markSending();
    IcsService.create(formData, {
      onUploadProgress: upload.onUploadProgress,
      idempotencyKey: draft.key(),
    })
      .then(async ({ data, replayed }) => {
        await draft.settle();
        notify(
          replayed
            ? `Ya se había guardado (ICS #${data.id})`
            : "ICS creado correctamente",
          true,
        );
        router.push("/ics");
      })
      // El aviso lo muestra el interceptor; aquí se marcan los campos.
      .catch(async (error) => {
        await draft.settle(error);
        failFromApi(error, icsApiField);
      })
      .finally(() => {
        setIsLoading(false);
        upload.reset();
      });
    /* else {
      IcsService.update(idCurrent, payload)
        .then(() => {
          toast.success("Ics actualizado correctamente");
          cancel();
        })
        .finally(() => setIsLoading(false));
    } */
  };

  // Salir con algo capturado pide confirmación. Con almacén de borradores,
  // lo capturado se queda en el dispositivo; sin él (modo privado), se pierde.
  // Un envío sin confirmar ya está guardado: sale directo.
  const cancel = async () => {
    if (hasCapture(form, attachedFile)) {
      const saved = await isDraftStorageAvailable();
      if (!(isLocked && saved)) {
        const confirmed = await confirm({
          title: "¿Salir del registro?",
          description: saved
            ? "Lo que capturaste queda guardado como borrador en este dispositivo: al volver a esta pantalla puedes recuperarlo."
            : "Este navegador no permite guardar borradores (por ejemplo, en modo privado): si sales, lo que capturaste se perderá.",
          confirmLabel: "Salir",
          cancelLabel: "Seguir editando",
          tone: saved ? "default" : "danger",
        });
        if (!confirmed) return;
      }
      // Lo último que se escribió puede no haberse guardado todavía.
      await draft.flush();
    }
    router.push("/ics");
  };

  // Descartar el borrador. Si estaba en solo lectura, se limpia lo capturado.
  const discardDraft = async () => {
    if (!(await draft.discard())) return;
    setForm(EMPTY_FORM);
    setImage("");
    setAttachedFile(null);
  };

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) return;

    setIdCurrent(id);
    IcsService.findOne(id).then(() => {
      /* setForm({
        totalPeople: `${data.totalPeople}`,
      }); */
    });
  }, [searchParams]);

  const employeesHelper = !form.manufacturingPlant
    ? "Elige una planta para ver a sus colaboradores."
    : employeesQuery.isSuccess && !employees.length
      ? "Esta planta no tiene colaboradores activos."
      : undefined;

  return (
    <>
      <PageHeader
        title={idCurrent ? "Editar registro de ICS" : "Nuevo registro de ICS"}
      />
      {(draft.offer || draft.lock) && (
        <Grid container sx={{ mb: 2 }}>
          <Grid size={12}>
            <DraftNotice
              offer={draft.offer}
              lock={draft.lock}
              onRestore={draft.restore}
              onDiscard={discardDraft}
              onRetry={send}
              isSending={isLoading}
            />
          </Grid>
        </Grid>
      )}
      <FormSection>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta *"
            value={form.manufacturingPlant}
            onChange={(e) => changeField("manufacturingPlant", e.target.value)}
            name="manufacturingPlant"
            disabled={isLocked}
          />
          <FieldError
            field="manufacturingPlant"
            message={errorOf("manufacturingPlant")}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          {catalogsQuery.isError ? (
            <ErrorState
              size="small"
              title="No se pudieron cargar las reglas de vida"
              offline={typeof navigator !== "undefined" && !navigator.onLine}
              onRetry={() => catalogsQuery.refetch()}
              isRetrying={catalogsQuery.isFetching}
            />
          ) : (
            <SelectDefault
              data={catalogs}
              label="Regla de vida *"
              value={form.ruleOfLife}
              onChange={(e) => changeField("ruleOfLife", e.target.value)}
              name="ruleOfLife"
              loading={catalogsQuery.isLoading}
              disabled={isLocked}
            />
          )}
          <FieldError field="ruleOfLife" message={errorOf("ruleOfLife")} />
        </Grid>
        {standards.length > 0 && (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <SelectDefault
              data={standards}
              label="Estándar de comportamiento"
              value={form.standardOfBehavior}
              onChange={(e) =>
                changeField("standardOfBehavior", e.target.value)
              }
              name="standardOfBehavior"
              disabled={isLocked}
            />
            <FieldError
              field="standardOfBehavior"
              message={errorOf("standardOfBehavior")}
            />
          </Grid>
        )}
        {areas.length > 0 && (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <SelectDefault
              data={areas}
              label="Área"
              value={form.areaOfBehavior}
              onChange={(e) => changeField("areaOfBehavior", e.target.value)}
              name="areaOfBehavior"
              disabled={isLocked}
            />
            <FieldError
              field="areaOfBehavior"
              message={errorOf("areaOfBehavior")}
            />
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
            {...fieldProps("totalPeople")}
            required
            fullWidth
            label="Personas totales"
            variant="outlined"
            value={form.totalPeople}
            autoComplete="off"
            slotProps={{
              htmlInput: { ...NUMERIC_INPUT, readOnly: isLocked },
            }}
            onChange={(e) => {
              // Solo enteros de 1 en adelante (antes, type="number" con
              // teclas bloqueadas; abría el teclado completo en algunos
              // teléfonos).
              const digits = e.target.value.replace(/[^0-9]/g, "");
              changeField(
                "totalPeople",
                digits && Number(digits) >= 1 ? String(Number(digits)) : "",
              );
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
          {employeesQuery.isError ? (
            <ErrorState
              size="small"
              title="No se pudieron cargar los colaboradores"
              offline={typeof navigator !== "undefined" && !navigator.onLine}
              onRetry={() => employeesQuery.refetch()}
              isRetrying={employeesQuery.isFetching}
            />
          ) : (
            <Autocomplete
              id="campo-employees"
              multiple
              options={employees}
              disableCloseOnSelect
              disabled={!form.manufacturingPlant || isLocked}
              loading={employeesQuery.isLoading}
              loadingText="Cargando…"
              noOptionsText="No hay colaboradores"
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                      checkedIcon={<CheckBoxIcon fontSize="small" />}
                      sx={{ mr: 1 }}
                      checked={selected}
                    />
                    {option.name}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Personas que no cumplen *"
                  error={!!errorOf("employees")}
                  helperText={errorOf("employees") ?? employeesHelper}
                />
              )}
              value={employees.filter((emp) =>
                form.employees.includes(String(emp.id)),
              )}
              onChange={(_, newValue) =>
                changeField(
                  "employees",
                  newValue.map((emp) => String(emp.id)),
                )
              }
            />
          )}
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 6,
          }}
        >
          {/* Con contorno, como el resto de los campos (M8). */}
          <TextField
            {...fieldProps("description")}
            multiline
            minRows={4}
            fullWidth
            value={form.description}
            onChange={(e) => changeField("description", e.target.value)}
            label="Descripción (opcional)"
            slotProps={{ input: { readOnly: isLocked } }}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <ImageORCamera
            setImage={setImage}
            image={image}
            setAttachedFile={setAttachedFile}
            attachedFile={attachedFile}
            uploadProgress={upload.progress}
            readOnly={isLocked}
          />
        </Grid>
      </FormSection>
      {/* Con un envío pendiente, las acciones son las del aviso. */}
      <FormActions
        onCancel={cancel}
        onSave={save}
        isSaving={isLoading}
        isSaveDisabled={isLocked}
      />
      {confirmDialog}
    </>
  );
};

export default IcsFormPage;
