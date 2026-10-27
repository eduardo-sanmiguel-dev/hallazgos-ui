"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

import { Grid } from "@mui/material";
import { Box } from "@mui/material";
import { Paper } from "@mui/material";
import { Typography } from "@mui/material";
import { Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";
import dayjs, { toISOStringOrNull } from "@shared/libs/dayjs";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type {
  DatesSetArg,
  DateSelectArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";

import { useGembaWalkZones } from "@hooks";
import { GembaWalkCalendarService } from "@services";
import { GembaWalkCalendar } from "@interfaces";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import PageHeader from "@shared/components/PageHeader";
import ConfirmDialog from "@shared/components/ConfirmDialog";
import DialogCalendarEvent, {
  CalendarOption,
  DialogState,
} from "../_components/DialogCalendarEvent";

// Evento pendiente de guardar. scheduledAt es ISO 8601 (instante real).
interface DraftEvent {
  gembaWalkZoneId: string;
  scheduledAt: string;
  isAdditional: boolean;
}

const DEFAULT_TIME = "08:00";

const toScheduledAt = (date: string, time: string) =>
  toISOStringOrNull(dayjs(`${date} ${time}`, "YYYY-MM-DD HH:mm"));

// No se crean ni editan eventos en el pasado.
const isPast = (scheduledAt: string | Date) =>
  new Date(scheduledAt).getTime() <= Date.now();

// Los recorridos adicionales se pintan con otro color (ver estilos "gw-additional").
const additionalClass = (isAdditional: boolean) =>
  isAdditional ? ["gw-additional"] : [];

const slotKey = (gembaWalkZoneId: string, scheduledAt: string) =>
  `${gembaWalkZoneId}|${new Date(scheduledAt).getTime()}`;

// Referencia del color de los eventos en el calendario.
const LegendItem = ({
  label,
  color,
}: {
  label: string;
  color: (theme: Theme) => string;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Box
      sx={{
        width: 14,
        height: 14,
        borderRadius: "4px",
        backgroundColor: color,
      }}
    />
    <Typography
      variant="body2"
      sx={{ color: (theme) => theme.palette.text.primary }}
    >
      {label}
    </Typography>
  </Box>
);

const GembaWalkCalendarFormPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = useMemo(() => {
    const date = searchParams.get("date");
    return date && dayjs(date, "YYYY-MM-DD", true).isValid() ? date : undefined;
  }, [searchParams]);

  const [manufacturingPlantId, setManufacturingPlantId] = useState<string>(
    searchParams.get("manufacturingPlantId") || "",
  );
  const [range, setRange] = useState<{ start: string; end: string } | null>(
    null,
  );
  const [savedEvents, setSavedEvents] = useState<GembaWalkCalendar[]>([]);
  const [newEvents, setNewEvents] = useState<Record<string, DraftEvent>>({});
  const [modifiedEvents, setModifiedEvents] = useState<
    Record<number, DraftEvent>
  >({});
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] =
    useState<boolean>(false);

  // Zonas Gemba de la planta elegida (caché compartida).
  const { data: gembaWalkZones } = useGembaWalkZones(
    { manufacturingPlantId },
    { enabled: !!manufacturingPlantId },
  );
  const zones = useMemo<CalendarOption[]>(
    () =>
      manufacturingPlantId && gembaWalkZones
        ? gembaWalkZones.map((zone) => ({
            id: zone.id,
            name: `${zone.nameZone} - ${zone.nameLocation}`,
          }))
        : [],
    [manufacturingPlantId, gembaWalkZones],
  );

  const calendarRef = useRef<FullCalendar>(null);
  const newKeyCounter = useRef(0);
  const lastViewType = useRef<string | null>(null);

  const newCount = Object.keys(newEvents).length;
  const modifiedCount = Object.keys(modifiedEvents).length;
  const hasChanges = newCount > 0 || modifiedCount > 0;

  const zoneName = useCallback(
    (gembaWalkZoneId: string) =>
      zones.find((zone) => String(zone.id) === gembaWalkZoneId)?.name || "Zona",
    [zones],
  );

  const getSavedEvents = useCallback(() => {
    if (!manufacturingPlantId || !range) {
      setSavedEvents([]);
      return;
    }

    GembaWalkCalendarService.findAll({
      manufacturingPlantId,
      startDate: range.start,
      endDate: range.end,
    }).then(setSavedEvents);
  }, [manufacturingPlantId, range]);

  useEffect(() => {
    getSavedEvents();
  }, [getSavedEvents]);

  const savedById = useMemo(
    () => new Map(savedEvents.map((event) => [event.id, event])),
    [savedEvents],
  );

  // Estado vigente de un evento: "new-N" (sin guardar) o "saved-ID".
  const currentDraftOf = (eventKey: string): DraftEvent | undefined => {
    if (!eventKey.startsWith("saved-")) return newEvents[eventKey];

    const id = Number(eventKey.replace("saved-", ""));
    if (modifiedEvents[id]) return modifiedEvents[id];

    const saved = savedById.get(id);
    return saved
      ? {
          gembaWalkZoneId: String(saved.gembaWalkZone.id),
          scheduledAt: saved.scheduledAt,
          isAdditional: saved.isAdditional,
        }
      : undefined;
  };

  const eventKeyOf = (extendedProps: Record<string, any>) =>
    extendedProps.kind === "new"
      ? (extendedProps.key as string)
      : `saved-${extendedProps.id}`;

  const events = useMemo<EventInput[]>(() => {
    const saved = savedEvents
      .filter((event) => !modifiedEvents[event.id])
      .map((event) => ({
        id: `saved-${event.id}`,
        title: `${event.gembaWalkZone.nameZone} - ${event.gembaWalkZone.nameLocation}`,
        start: event.scheduledAt,
        editable: !isPast(event.scheduledAt),
        classNames: [
          ...(isPast(event.scheduledAt) ? ["gw-past"] : []),
          ...additionalClass(event.isAdditional),
        ],
        extendedProps: { kind: "saved", id: event.id },
      }));

    const modified = Object.entries(modifiedEvents).map(([id, event]) => ({
      id: `saved-${id}`,
      title: zoneName(event.gembaWalkZoneId),
      start: event.scheduledAt,
      classNames: additionalClass(event.isAdditional),
      extendedProps: { kind: "modified", id: Number(id) },
    }));

    const created = Object.entries(newEvents).map(([key, event]) => ({
      id: key,
      title: zoneName(event.gembaWalkZoneId),
      start: event.scheduledAt,
      classNames: additionalClass(event.isAdditional),
      extendedProps: { kind: "new", key },
    }));

    return [...saved, ...modified, ...created];
  }, [savedEvents, modifiedEvents, newEvents, zoneName]);

  // Zona + instante de todos los eventos visibles, para evitar duplicados.
  const takenSlots = useMemo(() => {
    const slots = new Set<string>();

    savedEvents
      .filter((event) => !modifiedEvents[event.id])
      .forEach((event) =>
        slots.add(slotKey(String(event.gembaWalkZone.id), event.scheduledAt)),
      );
    Object.values(modifiedEvents).forEach((event) =>
      slots.add(slotKey(event.gembaWalkZoneId, event.scheduledAt)),
    );
    Object.values(newEvents).forEach((event) =>
      slots.add(slotKey(event.gembaWalkZoneId, event.scheduledAt)),
    );

    return slots;
  }, [savedEvents, modifiedEvents, newEvents]);

  const changePlant = (value: string) => {
    if (value === manufacturingPlantId) return;

    if (hasChanges) {
      toast.error("Guarda los cambios antes de cambiar de planta");
      return;
    }

    setManufacturingPlantId(value);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const previousViewType = lastViewType.current;
    lastViewType.current = arg.view.type;

    // Al cambiar a "Semana" se muestra la semana actual, no la del día 1 del mes.
    if (
      arg.view.type === "timeGridWeek" &&
      previousViewType &&
      previousViewType !== "timeGridWeek"
    ) {
      const now = new Date();

      if (now < arg.start || now >= arg.end) {
        setTimeout(() => arg.view.calendar.gotoDate(now));
        return;
      }
    }

    const start = arg.start.toISOString();
    const end = arg.end.toISOString();

    setRange((prev) =>
      prev?.start === start && prev?.end === end ? prev : { start, end },
    );
  };

  const handleSelect = (arg: DateSelectArg) => {
    calendarRef.current?.getApi().unselect();

    if (!zones.length) {
      toast.error("La planta seleccionada no tiene zonas registradas");
      return;
    }

    const dates: string[] = [];
    const end = dayjs(arg.end);

    if (arg.allDay) {
      // dayjs es inmutable: add devuelve una fecha nueva.
      for (
        let day = dayjs(arg.start);
        day.isBefore(end);
        day = day.add(1, "day")
      ) {
        dates.push(day.format("YYYY-MM-DD"));
      }
    } else {
      dates.push(dayjs(arg.start).format("YYYY-MM-DD"));
    }

    setDialogState({
      mode: "create",
      dates,
      time: arg.allDay ? DEFAULT_TIME : dayjs(arg.start).format("HH:mm"),
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const eventKey = eventKeyOf(arg.event.extendedProps);
    const current = currentDraftOf(eventKey);

    if (!current) return;

    if (isPast(current.scheduledAt)) {
      toast.info("Los eventos pasados no se pueden editar");
      return;
    }

    const start = dayjs(current.scheduledAt);

    setDialogState({
      mode: "edit",
      eventKey,
      isNew: arg.event.extendedProps.kind === "new",
      gembaWalkZoneId: current.gembaWalkZoneId,
      date: start.format("YYYY-MM-DD"),
      time: start.format("HH:mm"),
      isAdditional: current.isAdditional,
    });
  };

  // Aplica un cambio a un evento nuevo o guardado (marcándolo como modificado).
  const applyChange = (eventKey: string, draft: DraftEvent) => {
    if (!eventKey.startsWith("saved-")) {
      setNewEvents((prev) => ({ ...prev, [eventKey]: draft }));
      return;
    }

    const id = Number(eventKey.replace("saved-", ""));
    const original = savedById.get(id);
    const isSameAsOriginal =
      original &&
      String(original.gembaWalkZone.id) === draft.gembaWalkZoneId &&
      new Date(original.scheduledAt).getTime() ===
        new Date(draft.scheduledAt).getTime() &&
      original.isAdditional === draft.isAdditional;

    setModifiedEvents((prev) => {
      const next = { ...prev };

      if (isSameAsOriginal) {
        delete next[id];
      } else {
        next[id] = draft;
      }

      return next;
    });
  };

  const handleEventDrop = (arg: EventDropArg) => {
    const eventKey = eventKeyOf(arg.event.extendedProps);
    const current = currentDraftOf(eventKey);

    if (!current || !arg.event.start) {
      arg.revert();
      return;
    }

    const { gembaWalkZoneId } = current;
    const scheduledAt = arg.event.start.toISOString();

    if (isPast(current.scheduledAt) || isPast(scheduledAt)) {
      arg.revert();
      toast.error("No se pueden programar eventos en una fecha y hora pasada");
      return;
    }

    if (takenSlots.has(slotKey(gembaWalkZoneId, scheduledAt))) {
      arg.revert();
      toast.error("Ya existe un evento para esa zona en esa fecha y hora");
      return;
    }

    applyChange(eventKey, { ...current, scheduledAt });
  };

  const handleCreate = (
    zoneIds: string[],
    dates: string[],
    time: string,
    isAdditional: boolean,
  ) => {
    const additions: Record<string, DraftEvent> = {};
    let skipped = 0;
    let skippedPast = 0;

    dates.forEach((date) => {
      zoneIds.forEach((gembaWalkZoneId) => {
        const scheduledAt = toScheduledAt(date, time);

        if (isPast(scheduledAt)) {
          skippedPast++;
          return;
        }

        if (takenSlots.has(slotKey(gembaWalkZoneId, scheduledAt))) {
          skipped++;
          return;
        }

        newKeyCounter.current += 1;
        additions[`new-${newKeyCounter.current}`] = {
          gembaWalkZoneId,
          scheduledAt,
          isAdditional,
        };
      });
    });

    setNewEvents((prev) => ({ ...prev, ...additions }));
    setDialogState(null);

    if (skippedPast) {
      toast.warning(
        `${skippedPast} evento(s) omitido(s) porque la fecha y hora ya pasó`,
      );
    }

    if (skipped) {
      toast.warning(
        `${skipped} evento(s) omitido(s) porque ya existían para esa zona, fecha y hora`,
      );
    }
  };

  const handleEdit = (
    eventKey: string,
    gembaWalkZoneId: string,
    date: string,
    time: string,
    isAdditional: boolean,
  ) => {
    const draft = {
      gembaWalkZoneId,
      scheduledAt: toScheduledAt(date, time),
      isAdditional,
    };
    const current = currentDraftOf(eventKey);
    const draftSlot = slotKey(draft.gembaWalkZoneId, draft.scheduledAt);
    if (isPast(draft.scheduledAt)) {
      toast.error("No se pueden programar eventos en una fecha y hora pasada");
      return;
    }

    const isSameSlot =
      !!current &&
      slotKey(current.gembaWalkZoneId, current.scheduledAt) === draftSlot;

    if (!isSameSlot && takenSlots.has(draftSlot)) {
      toast.error("Ya existe un evento para esa zona en esa fecha y hora");
      return;
    }

    applyChange(eventKey, draft);
    setDialogState(null);
  };

  const handleRemoveNew = (eventKey: string) => {
    setNewEvents((prev) => {
      const next = { ...prev };
      delete next[eventKey];
      return next;
    });
    setDialogState(null);
  };

  const goBack = () => router.push("/gemba-walk/calendar");

  // Si hay eventos sin guardar se pide confirmación antes de salir.
  const cancel = () => {
    if (hasChanges) {
      setIsCancelConfirmOpen(true);
      return;
    }

    goBack();
  };

  const save = async () => {
    if (!hasChanges) return;

    setIsLoading(true);

    try {
      if (newCount) {
        await GembaWalkCalendarService.create({
          events: Object.values(newEvents).map((event) => ({
            gembaWalkZoneId: Number(event.gembaWalkZoneId),
            scheduledAt: event.scheduledAt,
            isAdditional: event.isAdditional,
          })),
        });
        setNewEvents({});
      }

      if (modifiedCount) {
        await GembaWalkCalendarService.update({
          events: Object.entries(modifiedEvents).map(([id, event]) => ({
            id: Number(id),
            gembaWalkZoneId: Number(event.gembaWalkZoneId),
            scheduledAt: event.scheduledAt,
            isAdditional: event.isAdditional,
          })),
        });
        setModifiedEvents({});
      }

      toast.success("Calendario guardado correctamente");
      goBack();
    } catch {
      // El error ya se notifica en axiosWrapper; lo guardado se refleja al recargar.
      getSavedEvents();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <PageHeader title="Gemba Walk - Calendario" />
      </Grid>
      <SelectManufacturingPlantsOwn
        value={manufacturingPlantId}
        onChange={(e) => changePlant(e.target.value)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CloseIcon />}
          onClick={cancel}
          sx={{ minHeight: 44 }}
        >
          Cancelar
        </Button>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          loading={isLoading}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
          color="primary"
          fullWidth
          onClick={save}
          disabled={!hasChanges || isLoading}
          sx={{ minHeight: 44 }}
        >
          Guardar
        </Button>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography
          variant="body2"
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          {manufacturingPlantId
            ? "Selecciona uno o varios días (de hoy en adelante) para agregar eventos. Arrastra o haz clic en un evento futuro para editarlo."
            : "Selecciona una planta para ver y programar eventos."}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 3,
          }}
        >
          <LegendItem
            label="Recorrido regular"
            color={(theme) => theme.palette.primary.main}
          />
          <LegendItem
            label="Recorrido adicional"
            color={(theme) => theme.palette.info.main}
          />
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Paper
          sx={(theme) => ({
            p: 2,
            "--fc-border-color": theme.palette.divider,
            "--fc-page-bg-color": theme.palette.background.paper,
            "--fc-neutral-bg-color": theme.palette.action.hover,
            "--fc-list-event-hover-bg-color": theme.palette.action.hover,
            "--fc-today-bg-color": alpha(theme.palette.primary.main, 0.12),
            "--fc-event-bg-color": theme.palette.primary.main,
            "--fc-event-border-color": theme.palette.primary.main,
            "--fc-button-bg-color": theme.palette.primary.main,
            "--fc-button-border-color": theme.palette.primary.main,
            "--fc-button-hover-bg-color": theme.palette.primary.dark,
            "--fc-button-hover-border-color": theme.palette.primary.dark,
            "--fc-button-active-bg-color": theme.palette.primary.dark,
            "--fc-button-active-border-color": theme.palette.primary.dark,
            "& .fc": { color: theme.palette.text.primary },
            "& .fc .fc-toolbar-title": { fontSize: "1.25rem" },
            "& .fc-event": { cursor: "pointer" },
            "& .fc .fc-day-past": {
              backgroundColor: theme.palette.action.disabledBackground,
            },
            "& .fc-event.gw-past": { opacity: 0.6, cursor: "default" },
            "& .fc-event.gw-additional": {
              backgroundColor: theme.palette.info.main,
              borderColor: theme.palette.info.main,
            },
            "& .fc-event.gw-additional .fc-event-main, & .fc-event.gw-additional .fc-event-title, & .fc-event.gw-additional .fc-event-time":
              { color: theme.palette.info.contrastText },
          })}
        >
          <Box>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={initialDate}
              locale={esLocale}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              height="auto"
              selectable={!!manufacturingPlantId}
              editable={!!manufacturingPlantId}
              eventDurationEditable={false}
              dayMaxEvents={4}
              eventDisplay="block"
              views={{
                timeGridWeek: {
                  titleFormat: {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  },
                  dayHeaderFormat: {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                  },
                },
              }}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              events={events}
              datesSet={handleDatesSet}
              select={handleSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              selectAllow={(info) =>
                info.allDay
                  ? !dayjs(info.start).isBefore(dayjs().startOf("day"))
                  : !isPast(info.start)
              }
              eventAllow={(dropInfo) =>
                dropInfo.allDay
                  ? !dayjs(dropInfo.start).isBefore(dayjs().startOf("day"))
                  : !isPast(dropInfo.start)
              }
            />
          </Box>
        </Paper>
      </Grid>
      <DialogCalendarEvent
        state={dialogState}
        zones={zones}
        onClose={() => setDialogState(null)}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onRemoveNew={handleRemoveNew}
      />
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={goBack}
        title="Eventos sin guardar"
        description={`Tienes ${[
          newCount && `${newCount} evento(s) nuevo(s)`,
          modifiedCount && `${modifiedCount} evento(s) modificado(s)`,
        ]
          .filter(Boolean)
          .join(
            " y ",
          )} sin guardar. Si cancelas, se perderán estos cambios. ¿Estás seguro de que deseas cancelar?`}
        cancelLabel="Regresar"
        confirmLabel="Salir sin guardar"
        tone="danger"
      />
    </Grid>
  );
};

export default GembaWalkCalendarFormPage;
