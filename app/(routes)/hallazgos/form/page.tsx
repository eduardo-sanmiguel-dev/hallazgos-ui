"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import ClearIcon from "@mui/icons-material/Clear";
import SaveIcon from "@mui/icons-material/Save";
import { TextField } from "@mui/material";
import { Button } from "@mui/material";
import { Paper } from "@mui/material";
import PageHeader from "@shared/components/PageHeader";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

import { EvidencesService, handleErrorResponse, UsersService } from "@services";
import { useUserSessionStore } from "@store";
import { EMPTY_CATALOG, useMainTypes, useProcesses, useZones } from "@hooks";
import ImageORCamera from "@shared/components/ImageORCamera";
import { dataURLtoFile, notify } from "@shared/utils";
import SelectDefault from "@components/SelectDefault";
import { SecondaryType, User } from "@interfaces";
import {
  formatDayLabel,
  priorityOptions,
} from "@routes/hallazgos/_constants/priorityOptions";
import { isUnsafeBehaviorType } from "@routes/hallazgos/_constants/mainTypes";

import "./form.css";

// Opción del selector de supervisor (GET /users/supervisors con zona).
type ZoneSupervisor = Pick<User, "id" | "name" | "email">;

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
  const [isUnsafeBehavior, setIsUnsafeBehavior] = useState<boolean>(false);
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

  const router = useRouter();

  // Por contenido y no por referencia: cada setSession trae un arreglo nuevo
  // (aunque sea igual) y no debe borrar la planta ya elegida.
  const plantsCurrentKey = manufacturingPlantsCurrent.join(",");

  useEffect(() => {
    const plants = plantsCurrentKey ? plantsCurrentKey.split(",") : [];
    setManufacturingPlantId(plants.length === 1 ? plants[0] : "");
  }, [plantsCurrentKey]);

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

  const isValidForm = useMemo(() => {
    /* (manufacturingPlantId &&
      typeHallazgo &&
      secondaryType &&
      zone &&
      process &&
      currentDescription &&
      isUnsafeBehavior
        ? currentDescription
        : image || attachedFile) || isLoading */

    let validate =
      !manufacturingPlantId ||
      !typeHallazgo ||
      !secondaryType ||
      !zone ||
      !process ||
      !currentDescription ||
      !supervisor;

    // Cuando no es un comportamiento inseguro, se valida que haya imagen o archivo adjunto
    if (!isUnsafeBehavior) {
      validate = validate || (!image && !attachedFile);
    }

    return !validate || isLoading;
  }, [
    manufacturingPlantId,
    typeHallazgo,
    secondaryType,
    zone,
    image,
    isLoading,
    attachedFile,
    process,
    isUnsafeBehavior,
    currentDescription,
    supervisor,
  ]);

  const saveEvidence = async () => {
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
    EvidencesService.create(formData)
      .then(() => {
        notify("Hallazgo creado correctamente", true);
        router.push("/hallazgos");
      })
      .catch(handleErrorResponse)
      .finally(() => setIsLoading(false));
  };

  // Se recalcula con cada clasificación: antes solo se activaba y, al cambiar
  // a otra, la foto dejaba de ser obligatoria.
  const validateUnsafeBehavior = (value: string) => {
    const mainTypeCurrent = mainTypes.find(
      (data) => data.id === Number(value ?? 0),
    );

    setIsUnsafeBehavior(isUnsafeBehaviorType(mainTypeCurrent?.name));
  };

  return (
    <>
      <PageHeader title="Nuevo hallazgo" />
      <Grid container spacing={2}>
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
            validationEmpty
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
              validateUnsafeBehavior(value);
            }}
            validationEmpty
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
            data={secondaryTypes}
            label="Tipo"
            value={secondaryType}
            onChange={(e) => setSecondaryType(e.target.value)}
            helperText={!typeHallazgo ? "Seleccione un hallazgo" : ""}
            validationEmpty
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
            validationEmpty
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
            data={processes.filter(
              (data) =>
                data.manufacturingPlant.id === Number(manufacturingPlantId),
            )}
            label="Proceso"
            value={process}
            onChange={(e) => setProcess(e.target.value)}
            validationEmpty
            helperText={!manufacturingPlantId ? "Seleccione una planta" : ""}
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
            validationEmpty
          />
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
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <TextField
              id="description-multiline"
              multiline
              rows={4}
              variant="standard"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              label={
                currentDescription
                  ? "Descripción del comportamiento inseguro"
                  : ""
              }
              helperText={
                !currentDescription
                  ? "Por favor, ingrese una descripción del comportamiento inseguro"
                  : ""
              }
              error={!currentDescription}
            />
          </Paper>
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
          />
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
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveEvidence}
              loading={isLoading}
              loadingPosition="start"
              disabled={!isValidForm || isLoading}
            >
              Crear hallazgo
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
