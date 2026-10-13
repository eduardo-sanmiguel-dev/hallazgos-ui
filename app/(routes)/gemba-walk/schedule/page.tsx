"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Grid } from "@mui/material";
import { Box } from "@mui/material";
import { Paper } from "@mui/material";
import { Button } from "@mui/material";
import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import type {
  DatesSetArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import { GembaWalksService, GembaWalkScheduleEvent } from "@services";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import GembaWalkAccessGuard from "../_components/GembaWalkAccessGuard";

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

const STATUS_MARK: Record<GembaWalkScheduleEvent["status"], string> = {
  DONE: "✓ ",
  MISSED: "✗ ",
  PENDING: "",
};

// Calendario informativo: no permite crear, editar ni eliminar eventos.
const GembaWalkSchedule = () => {
  const router = useRouter();

  const [manufacturingPlantId, setManufacturingPlantId] = useState("");
  const [range, setRange] = useState<{ start: string; end: string } | null>(
    null,
  );
  const [scheduleEvents, setScheduleEvents] = useState<
    GembaWalkScheduleEvent[]
  >([]);

  const lastViewType = useRef<string | null>(null);

  const getEvents = useCallback(() => {
    if (!manufacturingPlantId || !range) {
      setScheduleEvents([]);
      return;
    }

    GembaWalksService.findCalendar({
      manufacturingPlantId,
      startDate: range.start,
      endDate: range.end,
    }).then(setScheduleEvents);
  }, [manufacturingPlantId, range]);

  useEffect(() => {
    getEvents();
  }, [getEvents]);

  const events = useMemo<EventInput[]>(
    () =>
      scheduleEvents.map((event) => ({
        id: String(event.id),
        title: `${STATUS_MARK[event.status]}${event.gembaWalkZone.nameZone} - ${event.gembaWalkZone.nameLocation}`,
        start: event.scheduledAt,
        classNames: event.isAdditional ? ["gw-additional"] : [],
        extendedProps: { gembaWalkId: event.gembaWalkId },
      })),
    [scheduleEvents],
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    const previousViewType = lastViewType.current;
    lastViewType.current = arg.view.type;

    // Al cambiar a "Semana" se muestra la semana actual.
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

  // Los recorridos realizados por el observador abren su detalle.
  const handleEventClick = (arg: EventClickArg) => {
    const { gembaWalkId } = arg.event.extendedProps;

    if (gembaWalkId) {
      router.push(`/gemba-walk/view?id=${gembaWalkId}`);
    }
  };

  return (
    <Grid container spacing={2}>
      <SelectManufacturingPlantsOwn
        value={manufacturingPlantId}
        onChange={(e) => setManufacturingPlantId(e.target.value)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/gemba-walk")}
        >
          Regresar
        </Button>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography
          variant="body2"
          sx={{ color: (theme) => theme.palette.text.secondary }}
        >
          {manufacturingPlantId
            ? "Calendario informativo de tus recorridos programados. ✓ son los que realizaste (clic para ver el detalle) y ✗ los que no realizaste: los hizo otro observador o venció la tolerancia para iniciarlos."
            : "Selecciona una planta para ver el calendario de recorridos."}
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
          <Typography
            variant="body2"
            sx={{ color: (theme) => theme.palette.text.primary }}
          >
            ✓ Realizado por ti
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: (theme) => theme.palette.text.primary }}
          >
            ✗ No realizado por ti
          </Typography>
        </Box>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Paper
          sx={(theme) => ({
            p: 2,
            "--fc-border-color": theme.palette.divider,
            "--fc-page-bg-color": theme.palette.background.paper,
            "--fc-neutral-bg-color": theme.palette.action.hover,
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
            "& .fc .fc-day-past": {
              backgroundColor: theme.palette.action.disabledBackground,
            },
            "& .fc-event.gw-additional": {
              backgroundColor: theme.palette.info.main,
              borderColor: theme.palette.info.main,
            },
            "& .fc-event.gw-additional .fc-event-main, & .fc-event.gw-additional .fc-event-title, & .fc-event.gw-additional .fc-event-time":
              { color: theme.palette.info.contrastText },
          })}
        >
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            height="auto"
            selectable={false}
            editable={false}
            dayMaxEvents={4}
            eventDisplay="block"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
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
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

const GembaWalkSchedulePage = () => (
  <Grid container>
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.common.black
              : theme.palette.common.white,
        }}
      >
        Gemba Walk - Calendario de recorridos
      </Typography>
    </Grid>
    <Grid size={{ xs: 12 }}>
      <GembaWalkAccessGuard>
        <GembaWalkSchedule />
      </GembaWalkAccessGuard>
    </Grid>
  </Grid>
);

export default GembaWalkSchedulePage;
