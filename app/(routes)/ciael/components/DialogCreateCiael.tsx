import { useMemo, useState } from "react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TextField } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { esES } from "@mui/x-date-pickers/locales";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { SelectChangeEvent } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Button } from "@mui/material";
import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Paper } from "@mui/material";
import { Grid } from "@mui/material";
import { toast } from "sonner";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { AssociatedTasksService } from "_services/associated-tasks.service";
import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { TypeOfLinksService } from "_services/type-of-links.service";
import SelectDefault from "@components/SelectDefault";
import { CiaelSelectField } from "./CiaelSelectField";
import { useFieldErrors } from "@hooks/useFieldErrors";
import { useUserSessionStore } from "@store";
import { EMPTY_CATALOG, useCatalog, useTypesOfEvents, useZones } from "@hooks";
import {
  AccidentPositionsService,
  AtAgentsService,
  AtMechanismsService,
  BodyPartsService,
  CiaelsService,
  CieDiagnosesService,
  EmployeesService,
  MachinesService,
  NatureOfEventsService,
  RiskFactorsService,
  TypeOfInjuriesService,
  UsersService,
  WorkingDaysService,
} from "@services";
import { FormProps, initialForm, trueFalseOptions } from "./ciaelForm";

// Campos del API → campos del formulario: los catálogos van sin "Id"
// (typeOfEventId → typeOfEvent).
const ciaelApiField = (path: string) => {
  const field = path.split(".")[0].replace(/Ids?$/, "");
  if (field === "natureOfEvents") return "natureOfEvent";
  if (field === "machineName") return "machine";
  return field;
};

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
}

export default function DialogCreateCiael({ open, setOpen, getData }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormProps>(initialForm);

  // Catálogos compartidos por toda la app (caché de React Query).
  const typesOfEvents = useTypesOfEvents().data ?? EMPTY_CATALOG;
  const cieDiagnoses =
    useCatalog("cieDiagnoses", CieDiagnosesService.findAll).data ??
    EMPTY_CATALOG;
  const bodyParts =
    useCatalog("bodyParts", BodyPartsService.findAll).data ?? EMPTY_CATALOG;
  const atAgents =
    useCatalog("atAgents", AtAgentsService.findAll).data ?? EMPTY_CATALOG;
  const typeOfInjuries =
    useCatalog("typeOfInjuries", TypeOfInjuriesService.findAll).data ??
    EMPTY_CATALOG;
  const atMechanisms =
    useCatalog("atMechanisms", AtMechanismsService.findAll).data ??
    EMPTY_CATALOG;
  const workingDays =
    useCatalog("workingDays", WorkingDaysService.findAll).data ?? EMPTY_CATALOG;
  const typesOfLinks =
    useCatalog("typesOfLinks", TypeOfLinksService.findAll).data ??
    EMPTY_CATALOG;
  const riskFactors =
    useCatalog("riskFactors", RiskFactorsService.findAll).data ?? EMPTY_CATALOG;
  const natureOfEvents =
    useCatalog("natureOfEvents", NatureOfEventsService.findAll).data ??
    EMPTY_CATALOG;
  const { data: users } = useCatalog("users", () => UsersService.findAll({}));
  const managersOnDuty = useMemo(
    () => [...(users ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  // Dependen de la planta elegida.
  const manufacturingPlantId = form.manufacturingPlant;
  const byPlant = {
    enabled: !!manufacturingPlantId,
    params: { manufacturingPlantId },
  };
  const employees =
    useCatalog(
      "employees",
      () =>
        EmployeesService.findAll({
          manufacturingPlantId: Number(manufacturingPlantId),
        }),
      byPlant,
    ).data ?? EMPTY_CATALOG;
  const zones =
    useZones(
      { manufacturingPlantId, withArea: true },
      { enabled: !!manufacturingPlantId },
    ).data ?? EMPTY_CATALOG;
  const accidentPositions =
    useCatalog(
      "accidentPositions",
      () => AccidentPositionsService.findAll({ manufacturingPlantId }),
      byPlant,
    ).data ?? EMPTY_CATALOG;
  const machines =
    useCatalog(
      "machines",
      () => MachinesService.findAll({ manufacturingPlantId }),
      byPlant,
    ).data ?? EMPTY_CATALOG;
  const associatedTasks =
    useCatalog(
      "associatedTasks",
      () => AssociatedTasksService.findAll({ manufacturingPlantId }),
      byPlant,
    ).data ?? EMPTY_CATALOG;

  // Líderes de la zona elegida.
  const areaLeaders =
    useCatalog("users", () => UsersService.findAll({ zoneId: form.zone }), {
      enabled: !!form.zone,
      params: { zoneId: form.zone },
    }).data ?? EMPTY_CATALOG;
  const { fail, failFromApi, errorOf, fieldProps } = useFieldErrors<
    | "manufacturingPlant"
    | "typeOfEvent"
    | "cieDiagnosis"
    | "employee"
    | "eventDate"
    | "description"
    | "zone"
    | "accidentPosition"
    | "bodyPart"
    | "atAgent"
    | "typeOfInjury"
    | "atMechanism"
    | "workingDay"
    | "timeWorked"
    | "usualWork"
    | "typeOfLink"
    | "isDeath"
    | "machine"
    | "isInside"
    | "associatedTask"
    | "areaLeader"
    | "riskFactor"
    | "natureOfEvent"
  >(form);

  const resetForm = () => setForm(initialForm);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const blockedKeys = ["e", "E", "+", "-", "."];
    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const name = event.target.name;
    const sanitized = value.replace(/[^0-9]/g, "");
    if (sanitized !== "" && parseInt(sanitized, 10) < 1) {
      setForm({ ...form, [name]: "" });
    } else {
      setForm({ ...form, [name]: sanitized });
    }
  };

  const onChangeSelect = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setForm({
      ...form,
      [name]: value,
    });
  };

  const saveCiael = () => {
    const {
      manufacturingPlant,
      typeOfEvent,
      cieDiagnosis,
      employee,
      eventDate,
      description,
      daysOfDisability,
      zone,
      accidentPosition,
      bodyPart,
      atAgent,
      typeOfInjury,
      atMechanism,
      workingDay,
      timeWorked,
      usualWork,
      typeOfLink,
      isDeath,
      machine,
      isInside,
      associatedTask,
      areaLeader,
      riskFactor,
      natureOfEvent,
      manager,
    } = form;

    const descriptionClean = description.trim();

    if (!manufacturingPlant) {
      fail("manufacturingPlant", "Seleccione una planta");
      return;
    }

    if (!typeOfEvent) {
      fail("typeOfEvent", "Seleccione un tipo de evento");
      return;
    }

    if (!cieDiagnosis) {
      fail("cieDiagnosis", "Seleccione un diagnóstico CIE");
      return;
    }

    if (!employee) {
      fail("employee", "Seleccione un colaborador");
      return;
    }

    if (!eventDate) {
      fail("eventDate", "Seleccione la fecha del evento");
      return;
    }

    if (!descriptionClean) {
      fail("description", "Ingrese la descripción del evento");
      return;
    }

    if (!zone) {
      fail("zone", "Seleccione una zona");
      return;
    }

    if (!accidentPosition) {
      fail("accidentPosition", "Seleccione un nombre del cargo");
      return;
    }

    if (!bodyPart) {
      fail("bodyPart", "Seleccione una parte del cuerpo afectada");
      return;
    }

    if (!atAgent) {
      fail("atAgent", "Seleccione un agente AT");
      return;
    }

    if (!typeOfInjury) {
      fail("typeOfInjury", "Seleccione un tipo de lesión");
      return;
    }

    if (!atMechanism) {
      fail("atMechanism", "Seleccione un mecanismo o formas del AT");
      return;
    }

    if (!workingDay) {
      fail("workingDay", "Seleccione una jornada");
      return;
    }

    if (!timeWorked) {
      fail("timeWorked", "Ingrese el tiempo laborado previo al AT");
      return;
    }

    if (!usualWork) {
      fail("usualWork", "Seleccione si es labor habitual");
      return;
    }

    if (!typeOfLink) {
      fail("typeOfLink", "Seleccione un tipo de vinculación");
      return;
    }

    if (!isDeath) {
      fail("isDeath", "Seleccione si causó la muerte");
      return;
    }

    if (!machine) {
      fail("machine", "Seleccione una máquina o equipo");
      return;
    }

    if (!isInside) {
      fail("isInside", "Seleccione si fue dentro de la planta");
      return;
    }

    if (!associatedTask) {
      fail("associatedTask", "Seleccione una tarea asociada");
      return;
    }

    if (!areaLeader) {
      fail("areaLeader", "Seleccione un líder de área");
      return;
    }

    if (!riskFactor) {
      fail("riskFactor", "Seleccione un factor de riesgo asociado");
      return;
    }

    if (!natureOfEvent) {
      fail("natureOfEvent", "Seleccione una naturaleza del evento");
      return;
    }

    const payload = {
      manufacturingPlantId: manufacturingPlant,
      typeOfEventId: typeOfEvent,
      description: descriptionClean,
      employeeId: employee,
      eventDate: eventDate.format("YYYY-MM-DD"),
      cieDiagnosisId: cieDiagnosis,
      ...(daysOfDisability && { daysOfDisability }),
      accidentPositionId: accidentPosition,
      zoneId: zone,
      bodyPartId: bodyPart,
      atAgentId: atAgent,
      typeOfInjuryId: typeOfInjury,
      atMechanismId: atMechanism,
      workingDayId: workingDay,
      timeWorked,
      usualWork: usualWork === "1",
      typeOfLinkId: typeOfLink,
      isDeath: isDeath === "1",
      //"machineName": "maquina Test"
      machineId: machine,
      isInside: isInside === "1",
      associatedTaskId: associatedTask,
      areaLeaderId: areaLeader,
      riskFactorId: riskFactor,
      natureOfEventsId: natureOfEvent,
      ...(manager && { managerId: manager }),
    };

    setIsLoading(true);
    CiaelsService.create(payload)
      .then(() => {
        getData();
        toast.success("CIAEL creado con éxito");
        handleClose();
      })
      .catch((error) => failFromApi(error, ciaelApiField))
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={() => {
        if (!isLoading) handleClose();
      }}
      slots={{ transition: Transition }}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="h2">
            Nuevo registro CIAEL
          </Typography>
          <Button
            autoFocus
            color="inherit"
            onClick={saveCiael}
            loading={isLoading}
            disabled={isLoading}
          >
            Guardar
          </Button>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2} sx={{ p: { xs: 2, sm: 3, md: 5 } }}>
        <CiaelSelectField
          name="manufacturingPlant"
          label="Planta *"
          data={manufacturingPlants}
          value={form.manufacturingPlant}
          onChange={onChangeSelect}
          error={errorOf("manufacturingPlant")}
        />
        <CiaelSelectField
          name="employee"
          label="Colaborador *"
          data={employees}
          value={form.employee}
          onChange={onChangeSelect}
          error={errorOf("employee")}
        />
        <CiaelSelectField
          name="typeOfEvent"
          label="Tipo de evento *"
          data={typesOfEvents}
          value={form.typeOfEvent}
          onChange={onChangeSelect}
          error={errorOf("typeOfEvent")}
        />
        <Grid
          size={{
            xs: 12,
            sm: 4,
            md: 2,
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
                label="Fecha del evento *"
                format="DD/MM/YYYY"
                maxDate={dayjs()}
                value={form.eventDate}
                onChange={(newValue: Dayjs | null) =>
                  setForm({ ...form, eventDate: newValue })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    ...fieldProps("eventDate"),
                  } as any,
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>
        <CiaelSelectField
          name="cieDiagnosis"
          label="Diagnóstico CIE *"
          data={cieDiagnoses}
          value={form.cieDiagnosis}
          onChange={onChangeSelect}
          error={errorOf("cieDiagnosis")}
        />
        <Grid
          size={{
            xs: 12,
            sm: 4,
            md: 2,
          }}
        >
          <Paper>
            <TextField
              label="Días de incapacidad"
              variant="outlined"
              fullWidth
              autoComplete="off"
              type="text"
              onKeyDown={handleKeyDown}
              value={form.daysOfDisability}
              name="daysOfDisability"
              onChange={handleChange}
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                },
              }}
            />
          </Paper>
        </Grid>
        <CiaelSelectField
          name="zone"
          label="Zona *"
          data={zones}
          value={form.zone}
          onChange={onChangeSelect}
          error={errorOf("zone")}
        />
        <CiaelSelectField
          name="accidentPosition"
          label="Nombre del cargo *"
          data={accidentPositions}
          value={form.accidentPosition}
          onChange={onChangeSelect}
          error={errorOf("accidentPosition")}
        />
        <CiaelSelectField
          name="bodyPart"
          label="Parte del cuerpo afectada *"
          data={bodyParts}
          value={form.bodyPart}
          onChange={onChangeSelect}
          error={errorOf("bodyPart")}
        />
        <CiaelSelectField
          name="atAgent"
          label="Agente AT *"
          data={atAgents}
          value={form.atAgent}
          onChange={onChangeSelect}
          error={errorOf("atAgent")}
        />
        <CiaelSelectField
          name="typeOfInjury"
          label="Tipo de lesión *"
          data={typeOfInjuries}
          value={form.typeOfInjury}
          onChange={onChangeSelect}
          error={errorOf("typeOfInjury")}
        />
        <CiaelSelectField
          name="atMechanism"
          label="Mecanismo o formas del AT *"
          data={atMechanisms}
          value={form.atMechanism}
          onChange={onChangeSelect}
          error={errorOf("atMechanism")}
        />
        <CiaelSelectField
          name="workingDay"
          label="Jornada *"
          data={workingDays}
          value={form.workingDay}
          onChange={onChangeSelect}
          error={errorOf("workingDay")}
        />
        <Grid
          size={{
            xs: 12,
            sm: 4,
            md: 2,
          }}
        >
          <Paper>
            <TextField
              label="Tiempo laborado previo al AT (H) *"
              variant="outlined"
              fullWidth
              autoComplete="off"
              type="text"
              onKeyDown={handleKeyDown}
              value={form.timeWorked}
              {...fieldProps("timeWorked")}
              name="timeWorked"
              onChange={handleChange}
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                },
              }}
            />
          </Paper>
        </Grid>
        <CiaelSelectField
          name="usualWork"
          label="Labor habitual *"
          data={trueFalseOptions}
          value={form.usualWork}
          onChange={onChangeSelect}
          error={errorOf("usualWork")}
        />
        <CiaelSelectField
          name="typeOfLink"
          label="Tipo de vinculación *"
          data={typesOfLinks}
          value={form.typeOfLink}
          onChange={onChangeSelect}
          error={errorOf("typeOfLink")}
        />
        <CiaelSelectField
          name="isDeath"
          label="Muerte *"
          data={trueFalseOptions}
          value={form.isDeath}
          onChange={onChangeSelect}
          error={errorOf("isDeath")}
        />
        <CiaelSelectField
          name="machine"
          label="Máquina / Equipo *"
          data={machines}
          value={form.machine}
          onChange={onChangeSelect}
          error={errorOf("machine")}
        />
        <CiaelSelectField
          name="isInside"
          label="Dentro de la empresa *"
          data={trueFalseOptions}
          value={form.isInside}
          onChange={onChangeSelect}
          error={errorOf("isInside")}
        />
        <CiaelSelectField
          name="associatedTask"
          label="Tarea asociada *"
          data={associatedTasks}
          value={form.associatedTask}
          onChange={onChangeSelect}
          error={errorOf("associatedTask")}
        />
        <CiaelSelectField
          name="areaLeader"
          label="Líder de área *"
          data={areaLeaders}
          value={form.areaLeader}
          onChange={onChangeSelect}
          error={errorOf("areaLeader")}
        />
        <CiaelSelectField
          name="riskFactor"
          label="Factor de riesgo asociado *"
          data={riskFactors}
          value={form.riskFactor}
          onChange={onChangeSelect}
          error={errorOf("riskFactor")}
        />
        <CiaelSelectField
          name="natureOfEvent"
          label="Naturaleza del evento *"
          data={natureOfEvents}
          value={form.natureOfEvent}
          onChange={onChangeSelect}
          error={errorOf("natureOfEvent")}
        />
        <Grid
          size={{
            xs: 12,
            sm: 4,
            md: 2,
          }}
        >
          <SelectDefault
            data={managersOnDuty}
            label="Gestor en turno"
            value={form.manager}
            onChange={onChangeSelect}
            name="manager"
          />
        </Grid>
        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <TextField
              {...fieldProps("description")}
              multiline
              rows={10}
              variant="standard"
              fullWidth
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              label="Descripción del evento *"
            />
          </Paper>
        </Grid>
      </Grid>
    </Dialog>
  );
}
