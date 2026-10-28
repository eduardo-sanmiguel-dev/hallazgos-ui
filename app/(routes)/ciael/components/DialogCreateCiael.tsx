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
import { Dialog } from "@mui/material";
import { AppBar } from "@mui/material";
import { Box } from "@mui/material";
import { Grid } from "@mui/material";
import { toast } from "sonner";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import { AssociatedTasksService } from "_services/associated-tasks.service";
import { Transition } from "@routes/hallazgos/_components/EvidencePreview";
import { TypeOfLinksService } from "_services/type-of-links.service";
import FormSection from "@shared/components/FormSection";
import FormActions from "@shared/components/FormActions";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { CiaelSelectField } from "./CiaelSelectField";
import { useFormFieldErrors } from "@hooks/useFieldErrors";
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
import {
  FormProps,
  initialForm,
  isFormDirty,
  missingCiaelFields,
  trueFalseOptions,
} from "./ciaelForm";

// Campos del API → campos del formulario: los catálogos van sin "Id"
// (typeOfEventId → typeOfEvent).
const ciaelApiField = (path: string) => {
  const field = path.split(".")[0].replace(/Ids?$/, "");
  if (field === "natureOfEvents") return "natureOfEvent";
  if (field === "machineName") return "machine";
  return field;
};

// Solo dígitos, como el teclado numérico que abren.
const NUMERIC_INPUT = { inputMode: "numeric", pattern: "[0-9]*" } as const;

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  getData: () => void;
}

export default function DialogCreateCiael({ open, setOpen, getData }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormProps>(initialForm);
  const { confirm, confirmDialog } = useConfirmDialog();

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

  // Dependen de la planta elegida: deshabilitados hasta elegirla.
  const manufacturingPlantId = form.manufacturingPlant;
  const noPlant = !manufacturingPlantId;
  const byPlant = {
    enabled: !noPlant,
    params: { manufacturingPlantId },
  };
  const employeesQuery = useCatalog(
    "employees",
    () =>
      EmployeesService.findAll({
        manufacturingPlantId: Number(manufacturingPlantId),
      }),
    byPlant,
  );
  const zonesQuery = useZones(
    { manufacturingPlantId, withArea: true },
    { enabled: !noPlant },
  );
  const accidentPositionsQuery = useCatalog(
    "accidentPositions",
    () => AccidentPositionsService.findAll({ manufacturingPlantId }),
    byPlant,
  );
  const machinesQuery = useCatalog(
    "machines",
    () => MachinesService.findAll({ manufacturingPlantId }),
    byPlant,
  );
  const associatedTasksQuery = useCatalog(
    "associatedTasks",
    () => AssociatedTasksService.findAll({ manufacturingPlantId }),
    byPlant,
  );

  // Líderes de la zona elegida.
  const areaLeadersQuery = useCatalog(
    "users",
    () => UsersService.findAll({ zoneId: form.zone }),
    {
      enabled: !!form.zone,
      params: { zoneId: form.zone },
    },
  );

  // Cada error se quita al cambiar su campo; los demás siguen marcados.
  const { failAll, failFromApi, errorOf, fieldProps } =
    useFormFieldErrors(form);

  const manufacturingPlants = useUserSessionStore(
    (state) => state.manufacturingPlants,
  );

  const handleClose = () => {
    setOpen(false);
    setForm(initialForm);
  };

  // Cerrar (X o Esc) con algo capturado pide confirmación: son 25 campos.
  const requestClose = async () => {
    if (isLoading) return;
    if (
      isFormDirty(form) &&
      !(await confirm({
        title: "¿Descartar el registro?",
        description: "Se perderá lo que capturaste en el formulario.",
        confirmLabel: "Descartar",
        cancelLabel: "Seguir editando",
        tone: "danger",
      }))
    ) {
      return;
    }
    handleClose();
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
    // Todo lo que falta, marcado junto a su campo (en el orden de la
    // pantalla); el foco va al primero.
    if (failAll(missingCiaelFields(form))) return;

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

    const payload = {
      manufacturingPlantId: manufacturingPlant,
      typeOfEventId: typeOfEvent,
      description: description.trim(),
      employeeId: employee,
      eventDate: eventDate!.format("YYYY-MM-DD"),
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
      onClose={requestClose}
      slots={{ transition: Transition }}
      aria-labelledby="ciael-dialog-title"
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={requestClose}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </IconButton>
          <Typography
            id="ciael-dialog-title"
            sx={{ ml: 2, flex: 1 }}
            variant="h6"
            component="h2"
          >
            Nuevo registro CIAEL
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          mx: "auto",
          p: { xs: 2, sm: 3 },
        }}
      >
        <FormSection
          title="Evento"
          description="Elige primero la planta: de ella dependen la zona, el colaborador, el cargo, la máquina y la tarea."
        >
          <CiaelSelectField
            name="manufacturingPlant"
            label="Planta *"
            data={manufacturingPlants}
            value={form.manufacturingPlant}
            onChange={onChangeSelect}
            error={errorOf("manufacturingPlant")}
          />
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
          </Grid>
          <CiaelSelectField
            name="typeOfEvent"
            label="Tipo de evento *"
            data={typesOfEvents}
            value={form.typeOfEvent}
            onChange={onChangeSelect}
            error={errorOf("typeOfEvent")}
          />
          <CiaelSelectField
            name="natureOfEvent"
            label="Naturaleza del evento *"
            data={natureOfEvents}
            value={form.natureOfEvent}
            onChange={onChangeSelect}
            error={errorOf("natureOfEvent")}
          />
          <CiaelSelectField
            name="zone"
            label="Zona *"
            data={zonesQuery.data ?? EMPTY_CATALOG}
            value={form.zone}
            onChange={onChangeSelect}
            error={errorOf("zone")}
            disabled={noPlant}
            loading={zonesQuery.isLoading}
          />
          <CiaelSelectField
            name="isInside"
            label="Dentro de la empresa *"
            data={trueFalseOptions}
            value={form.isInside}
            onChange={onChangeSelect}
            error={errorOf("isInside")}
          />
          <Grid size={12}>
            <TextField
              {...fieldProps("description")}
              multiline
              minRows={4}
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
          </Grid>
        </FormSection>

        <FormSection title="Colaborador">
          <CiaelSelectField
            name="employee"
            label="Colaborador *"
            data={employeesQuery.data ?? EMPTY_CATALOG}
            value={form.employee}
            onChange={onChangeSelect}
            error={errorOf("employee")}
            disabled={noPlant}
            loading={employeesQuery.isLoading}
          />
          <CiaelSelectField
            name="accidentPosition"
            label="Nombre del cargo *"
            data={accidentPositionsQuery.data ?? EMPTY_CATALOG}
            value={form.accidentPosition}
            onChange={onChangeSelect}
            error={errorOf("accidentPosition")}
            disabled={noPlant}
            loading={accidentPositionsQuery.isLoading}
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
            name="workingDay"
            label="Jornada *"
            data={workingDays}
            value={form.workingDay}
            onChange={onChangeSelect}
            error={errorOf("workingDay")}
          />
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Tiempo laborado previo al AT (H) *"
              fullWidth
              autoComplete="off"
              type="text"
              onKeyDown={handleKeyDown}
              value={form.timeWorked}
              {...fieldProps("timeWorked")}
              name="timeWorked"
              onChange={handleChange}
              slotProps={{ htmlInput: NUMERIC_INPUT }}
            />
          </Grid>
          <CiaelSelectField
            name="usualWork"
            label="Labor habitual *"
            data={trueFalseOptions}
            value={form.usualWork}
            onChange={onChangeSelect}
            error={errorOf("usualWork")}
          />
        </FormSection>

        <FormSection title="Lesión">
          <CiaelSelectField
            name="cieDiagnosis"
            label="Diagnóstico CIE *"
            data={cieDiagnoses}
            value={form.cieDiagnosis}
            onChange={onChangeSelect}
            error={errorOf("cieDiagnosis")}
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
            name="typeOfInjury"
            label="Tipo de lesión *"
            data={typeOfInjuries}
            value={form.typeOfInjury}
            onChange={onChangeSelect}
            error={errorOf("typeOfInjury")}
          />
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Días de incapacidad"
              fullWidth
              autoComplete="off"
              type="text"
              onKeyDown={handleKeyDown}
              value={form.daysOfDisability}
              {...fieldProps("daysOfDisability")}
              helperText={errorOf("daysOfDisability") ?? "Opcional"}
              name="daysOfDisability"
              onChange={handleChange}
              slotProps={{ htmlInput: NUMERIC_INPUT }}
            />
          </Grid>
          <CiaelSelectField
            name="isDeath"
            label="Muerte *"
            data={trueFalseOptions}
            value={form.isDeath}
            onChange={onChangeSelect}
            error={errorOf("isDeath")}
          />
        </FormSection>

        <FormSection title="Causas">
          <CiaelSelectField
            name="atAgent"
            label="Agente AT *"
            data={atAgents}
            value={form.atAgent}
            onChange={onChangeSelect}
            error={errorOf("atAgent")}
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
            name="riskFactor"
            label="Factor de riesgo asociado *"
            data={riskFactors}
            value={form.riskFactor}
            onChange={onChangeSelect}
            error={errorOf("riskFactor")}
          />
          <CiaelSelectField
            name="machine"
            label="Máquina / Equipo *"
            data={machinesQuery.data ?? EMPTY_CATALOG}
            value={form.machine}
            onChange={onChangeSelect}
            error={errorOf("machine")}
            disabled={noPlant}
            loading={machinesQuery.isLoading}
          />
          <CiaelSelectField
            name="associatedTask"
            label="Tarea asociada *"
            data={associatedTasksQuery.data ?? EMPTY_CATALOG}
            value={form.associatedTask}
            onChange={onChangeSelect}
            error={errorOf("associatedTask")}
            disabled={noPlant}
            loading={associatedTasksQuery.isLoading}
          />
        </FormSection>

        <FormSection
          title="Responsables"
          description="El líder de área se elige entre los de la zona del evento."
        >
          <CiaelSelectField
            name="areaLeader"
            label="Líder de área *"
            data={areaLeadersQuery.data ?? EMPTY_CATALOG}
            value={form.areaLeader}
            onChange={onChangeSelect}
            error={errorOf("areaLeader")}
            disabled={!form.zone}
            loading={areaLeadersQuery.isLoading}
          />
          <CiaelSelectField
            name="manager"
            label="Gestor en turno"
            data={managersOnDuty}
            value={form.manager}
            onChange={onChangeSelect}
            error={errorOf("manager")}
          />
        </FormSection>

        <FormActions
          onCancel={requestClose}
          onSave={saveCiael}
          isSaving={isLoading}
        />
      </Box>
      {confirmDialog}
    </Dialog>
  );
}
