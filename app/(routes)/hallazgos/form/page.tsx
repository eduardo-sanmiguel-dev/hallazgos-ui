"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import ClearIcon from "@mui/icons-material/Clear";
import SaveIcon from "@mui/icons-material/Save";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { FormHelperText } from "@mui/material";
import PageHeader from "@shared/components/PageHeader";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import { EvidencesService, UsersService } from "@services";
import { useUserSessionStore } from "@store";
import {
  EMPTY_CATALOG,
  useMainTypes,
  useProcesses,
  useUploadProgress,
  useZones,
} from "@hooks";
import { useFieldErrors } from "@hooks/useFieldErrors";
import ImageORCamera from "@shared/components/ImageORCamera";
import DraftNotice from "@shared/components/DraftNotice";
import { useFormDraft } from "@hooks/useFormDraft";
import { dataURLtoFile, notify } from "@shared/utils";
import SelectDefault from "@components/SelectDefault";
import { SecondaryType, User } from "@interfaces";
import {
  formatDayLabel,
  priorityOptions,
} from "@routes/hallazgos/_constants/priorityOptions";
import { requiresPhotoEvidence } from "@routes/hallazgos/_constants/mainTypes";
import {
  readLastLocation,
  saveLastLocation,
} from "@routes/hallazgos/_constants/lastLocation";

import "./form.css";

// Opción del selector de supervisor (GET /users/supervisors con zona).
type ZoneSupervisor = Pick<User, "id" | "name" | "email">;

type EvidenceField =
  | "manufacturingPlantId"
  | "typeHallazgo"
  | "secondaryType"
  | "zone"
  | "process"
  | "supervisor"
  | "description"
  | "priorityDays"
  | "photo";

// Lo que se guarda en el borrador local (la foto va aparte).
interface EvidenceDraftFields {
  manufacturingPlantId: string;
  typeHallazgo: string;
  secondaryType: string;
  zone: string;
  process: string;
  supervisor: string;
  description: string;
  priorityDays: string;
}

// Campos del API con otro nombre en el formulario (type es el tipo).
const EVIDENCE_API_FIELDS = { type: "secondaryType", file: "photo" };

/** Mensaje de error bajo un select (lo encuentra useFieldErrors para el foco). */
const FieldError = ({ field, message }: { field: string; message?: string }) =>
  message ? (
    <FormHelperText data-error-for={field} error>
      {message}
    </FormHelperText>
  ) : null;

export default function HallazgosFormPage() {
  const [typeHallazgo, setTypeHallazgo] = useState<string>("");
  const [process, setProcess] = useState<string>("");
  const [secondaryType, setSecondaryType] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>("");
  const [secondaryTypes, setSecondaryTypes] = useState<SecondaryType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supervisorsCurrent, setSupervisorsCurrent] = useState<
    ZoneSupervisor[]
  >([]);
  const [supervisorsStatus, setSupervisorsStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [supervisor, setSupervisor] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [priorityDays, setPriorityDays] = useState<string>("");

  const mainTypes = useMainTypes().data ?? EMPTY_CATALOG;
  const zones = useZones().data ?? EMPTY_CATALOG;
  const processes = useProcesses().data ?? EMPTY_CATALOG;

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const manufacturingPlantsCurrent = useUserSessionStore(
    (state) => state.manufacturingPlantsCurrent,
  );

  const userId = useUserSessionStore((state) => state.id);

  const router = useRouter();
  const upload = useUploadProgress();

  // La clasificación decide si la foto es obligatoria. Se calcula (antes era
  // un estado que se actualizaba al elegir) para que también aplique al
  // recuperar un borrador.
  const isUnsafeBehavior = useMemo(
    () =>
      !!typeHallazgo &&
      !requiresPhotoEvidence(
        mainTypes.find((data) => data.id === Number(typeHallazgo)),
      ),
    [typeHallazgo, mainTypes],
  );

  // Borrador local (C3): lo capturado y la foto quedan en el dispositivo
  // hasta enviarse; la planta y el lugar propuestos no cuentan como captura.
  const draftFields: EvidenceDraftFields = {
    manufacturingPlantId,
    typeHallazgo,
    secondaryType,
    zone,
    process,
    supervisor,
    description,
    priorityDays,
  };
  const draft = useFormDraft<EvidenceDraftFields>({
    form: "nuevo-hallazgo",
    content: { fields: draftFields, photo: attachedFile },
    hasContent: ({ fields, photo }) =>
      !!photo ||
      [
        fields.typeHallazgo,
        fields.secondaryType,
        fields.process,
        fields.supervisor,
        fields.description.trim(),
        fields.priorityDays,
      ].some(Boolean),
    onRestore: ({ fields, photo }) => {
      // El lugar recuperado gana al último usado.
      lastZoneRestored.current = true;
      setManufacturingPlantId(fields.manufacturingPlantId);
      setTypeHallazgo(fields.typeHallazgo);
      setSecondaryType(fields.secondaryType);
      setZone(fields.zone);
      setProcess(fields.process);
      setSupervisor(fields.supervisor);
      setDescription(fields.description);
      setPriorityDays(fields.priorityDays);
      setImage("");
      setAttachedFile(photo);
    },
  });
  const isLocked = !!draft.lock;
  // Los errores aparecen al intentar guardar, no desde que se abre (A5).
  const { fail, failFromApi, errorOf, fieldProps } =
    useFieldErrors<EvidenceField>(
      manufacturingPlantId,
      typeHallazgo,
      secondaryType,
      zone,
      process,
      supervisor,
      description,
      priorityDays,
      image,
      attachedFile,
    );

  // Por contenido y no por referencia: cada setSession trae un arreglo nuevo
  // (aunque sea igual) y no debe borrar la planta ya elegida.
  const plantsCurrentKey = manufacturingPlantsCurrent.join(",");

  // Ids de las plantas del usuario, por contenido (mismo motivo).
  const userPlantsKey = manufacturingPlants.map(({ id }) => id).join(",");

  // Con una sola planta, esa; si no, la última que usó en este dispositivo
  // (si todavía la tiene asignada).
  useEffect(() => {
    const plants = plantsCurrentKey ? plantsCurrentKey.split(",") : [];
    if (plants.length === 1) {
      setManufacturingPlantId(plants[0]);
      return;
    }
    const last = userId ? readLastLocation(userId) : null;
    const isUserPlant =
      !!last && userPlantsKey.split(",").includes(last.manufacturingPlantId);
    setManufacturingPlantId(isUserPlant ? last.manufacturingPlantId : "");
  }, [plantsCurrentKey, userPlantsKey, userId]);

  // El último lugar, una sola vez y solo si es de la planta propuesta.
  const lastZoneRestored = useRef(false);
  useEffect(() => {
    if (lastZoneRestored.current) return;
    if (!userId || !manufacturingPlantId || !zones.length) return;
    lastZoneRestored.current = true;

    const last = readLastLocation(userId);
    if (last?.manufacturingPlantId !== manufacturingPlantId) return;
    const exists = zones.some(
      (data) =>
        String(data.id) === last.zoneId &&
        data.manufacturingPlant.id === Number(manufacturingPlantId),
    );
    if (exists) setZone(last.zoneId);
  }, [userId, manufacturingPlantId, zones]);

  useEffect(() => {
    if (typeHallazgo) {
      setSecondaryTypes(
        mainTypes.find((data) => data.id === Number(typeHallazgo))
          ?.secondaryTypes || [],
      );
    }
  }, [typeHallazgo, mainTypes]);

  // Supervisores del lugar elegido, pedidos a la API al elegirlo. Si el
  // supervisor ya elegido no es de este lugar, se quita (antes quedaba
  // seleccionado y la API rechazaba el hallazgo al guardar).
  useEffect(() => {
    if (!manufacturingPlantId || !zone) {
      setSupervisorsCurrent([]);
      setSupervisorsStatus("idle");
      setSupervisor("");
      return;
    }

    let ignore = false;
    setSupervisorsStatus("loading");
    UsersService.findZoneSupervisors({ manufacturingPlantId, zoneId: zone })
      .then((list) => {
        if (ignore) return;
        setSupervisorsCurrent(list);
        setSupervisorsStatus("idle");
        setSupervisor((current) =>
          list.some(({ id }) => String(id) === current) ? current : "",
        );
      })
      .catch(() => {
        if (ignore) return;
        setSupervisorsCurrent([]);
        setSupervisorsStatus("error");
        setSupervisor("");
      });
    return () => {
      ignore = true;
    };
  }, [manufacturingPlantId, zone]);

  const currentDescription = useMemo(() => description.trim(), [description]);

  // Primer campo que falta, en el orden del formulario; null si está
  // completo. Mismas reglas que antes deshabilitaban el botón.
  const firstMissing = (): [EvidenceField, string] | null => {
    if (!manufacturingPlantId)
      return ["manufacturingPlantId", "Selecciona la planta."];
    if (!typeHallazgo) return ["typeHallazgo", "Selecciona el hallazgo."];
    if (!secondaryType) return ["secondaryType", "Selecciona el tipo."];
    if (!zone) return ["zone", "Selecciona el lugar."];
    if (!process) return ["process", "Selecciona el proceso."];
    if (!supervisor) return ["supervisor", "Selecciona el supervisor."];
    if (!currentDescription)
      return ["description", "Describe lo que observaste."];
    // Si la clasificación exige foto, se valida que haya imagen o adjunto.
    if (!isUnsafeBehavior && !image && !attachedFile)
      return ["photo", "Agrega una foto de la evidencia."];
    return null;
  };

  const saveEvidence = () => {
    const missing = firstMissing();
    if (missing) {
      fail(...missing);
      return;
    }
    send();
  };

  // También es "Reintentar envío" de un borrador en solo lectura: mismos
  // datos y misma clave.
  const send = async () => {
    const formData = new FormData();

    formData.append("manufacturingPlantId", manufacturingPlantId);
    formData.append("typeHallazgo", typeHallazgo);
    formData.append("type", secondaryType);
    formData.append("zone", zone);
    formData.append("process", process);
    formData.append("description", currentDescription);

    if (priorityDays) {
      formData.append("priorityDays", priorityDays);
    }

    if (supervisor) {
      formData.append("supervisor", supervisor);
    }

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
    // Sin conexión o tiempo agotado: el aviso trae "Reintentar" y la foto y
    // los datos siguen aquí; la misma clave evita un hallazgo duplicado.
    EvidencesService.create(formData, {
      onUploadProgress: upload.onUploadProgress,
      idempotencyKey: draft.key(),
    })
      .then(async ({ data, replayed }) => {
        await draft.settle();
        if (userId) {
          saveLastLocation(userId, { manufacturingPlantId, zoneId: zone });
        }
        notify(
          replayed
            ? `Ya se había guardado (hallazgo #${data.id})`
            : "Hallazgo creado correctamente",
          true,
        );
        router.push("/hallazgos");
      })
      .catch(async (error) => {
        await draft.settle(error);
        failFromApi(error, EVIDENCE_API_FIELDS);
      })
      .finally(() => {
        setIsLoading(false);
        upload.reset();
      });
  };

  // Descartar el borrador. Si estaba en solo lectura, se limpia lo capturado
  // (la planta y el lugar se quedan como propuesta).
  const discardDraft = async () => {
    if (!(await draft.discard())) return;
    setTypeHallazgo("");
    setSecondaryType("");
    setProcess("");
    setSupervisor("");
    setDescription("");
    setPriorityDays("");
    setImage("");
    setAttachedFile(null);
  };

  return (
    <>
      <PageHeader title="Nuevo hallazgo" />
      <Grid container spacing={2}>
        {(draft.offer || draft.lock) && (
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
        )}
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={manufacturingPlants}
            label="Planta"
            value={manufacturingPlantId}
            onChange={(e) => setManufacturingPlantId(e.target.value)}
            disabled={isLocked}
          />
          <FieldError
            field="manufacturingPlantId"
            message={errorOf("manufacturingPlantId")}
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
            data={mainTypes}
            label="Hallazgo"
            value={typeHallazgo}
            onChange={({ target: { value } }) => {
              setTypeHallazgo(value);
              setSecondaryType("");
            }}
            disabled={isLocked}
          />
          <FieldError field="typeHallazgo" message={errorOf("typeHallazgo")} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={secondaryTypes}
            label="Tipo"
            value={secondaryType}
            onChange={(e) => setSecondaryType(e.target.value)}
            helperText={!typeHallazgo ? "Seleccione un hallazgo" : ""}
            disabled={isLocked}
          />
          <FieldError
            field="secondaryType"
            message={errorOf("secondaryType")}
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
            data={zones.filter(
              (data) =>
                data.manufacturingPlant.id === Number(manufacturingPlantId),
            )}
            label="Lugar"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            helperText={!manufacturingPlantId ? "Seleccione una planta" : ""}
            disabled={isLocked}
          />
          <FieldError field="zone" message={errorOf("zone")} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={processes.filter(
              (data) =>
                data.manufacturingPlant.id === Number(manufacturingPlantId),
            )}
            label="Proceso"
            value={process}
            onChange={(e) => setProcess(e.target.value)}
            helperText={!manufacturingPlantId ? "Seleccione una planta" : ""}
            disabled={isLocked}
          />
          <FieldError field="process" message={errorOf("process")} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
          }}
        >
          <SelectDefault
            data={supervisorsCurrent}
            label="Supervisor"
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            helperText={
              !manufacturingPlantId || !zone
                ? "Seleccione una planta y lugar"
                : ""
            }
            loading={supervisorsStatus === "loading"}
            attention={
              supervisorsStatus === "error"
                ? "No se pudieron cargar los supervisores; vuelva a elegir el lugar"
                : supervisorsStatus === "idle" && !supervisorsCurrent.length
                  ? "Este lugar no tiene supervisores asignados"
                  : undefined
            }
            disabled={isLocked}
          />
          <FieldError field="supervisor" message={errorOf("supervisor")} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2,
          }}
        >
          <SelectDefault
            data={priorityOptions.map((item) => ({
              id: item.days,
              name: `${item.name} (${formatDayLabel(item.days)})`,
            }))}
            label="Prioridad (opcional)"
            value={priorityDays}
            onChange={(e) => setPriorityDays(e.target.value)}
            isFilter={true}
            disabled={isLocked}
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          {/* Con contorno, como el resto de los campos (M8). */}
          <TextField
            {...fieldProps("description")}
            multiline
            minRows={4}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            label="Describe lo que observaste"
            slotProps={{ input: { readOnly: isLocked } }}
            helperText={
              errorOf("description") ??
              "Qué viste, dónde y por qué es un riesgo."
            }
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
          <FieldError field="photo" message={errorOf("photo")} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column-reverse", sm: "row" },
              justifyContent: "flex-end",
              gap: 1.5,
              "& .MuiButton-root": { minWidth: { sm: 180 }, minHeight: 44 },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => router.push("/hallazgos")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {/* Con un envío pendiente, las acciones son las del aviso. */}
            {!isLocked && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={saveEvidence}
                loading={isLoading}
                loadingPosition="start"
                disabled={isLoading}
              >
                Crear hallazgo
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
