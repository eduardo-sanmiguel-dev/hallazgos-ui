"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
import { Chip } from "@mui/material";
import { Alert } from "@mui/material";
import { Switch } from "@mui/material";
import { TextField } from "@mui/material";
import { Typography } from "@mui/material";
import { Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { Theme } from "@mui/material/styles";
import { toast } from "sonner";
import dayjs from "@shared/libs/dayjs";

import { GembaWalkEvaluationsService, GembaWalksService } from "@services";
import { GembaWalkCalendar, GembaWalkEvaluation } from "@interfaces";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import LoadingLinear from "@shared/components/LoadingLinear";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import GembaWalkAccessGuard from "../_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import { groupByCategory } from "../_components/groupByCategory";
import { formatDuration } from "../_components/formatDuration";

interface Answer {
  isCompliant: boolean;
  comments: string;
}

// Igual que la API (GEMBA_WALK_TOLERANCE_MINUTES): se puede INICIAR desde el
// inicio del día hasta 15 minutos después de la hora programada; puede
// terminarse después.
const TOLERANCE_MINUTES = 15;

const deadlineOf = (event: GembaWalkCalendar) =>
  dayjs(event.scheduledAt).add(TOLERANCE_MINUTES, "minute");

const isOutOfTime = (event: GembaWalkCalendar, now: Date) =>
  dayjs(now).isAfter(deadlineOf(event));

const eventLabel = (event: GembaWalkCalendar, now: Date) =>
  `${dayjs(event.scheduledAt).format("HH:mm")} · ${event.gembaWalkZone.nameZone} - ${event.gembaWalkZone.nameLocation}${event.isAdditional ? " (Adicional)" : ""}${isOutOfTime(event, now) ? " — Fuera de tiempo" : ""}`;

const textColor = { color: (theme: Theme) => theme.palette.text.primary };
const secondaryTextColor = {
  color: (theme: Theme) => theme.palette.text.secondary,
};

interface StartedWalk {
  startToken: string;
  startedAt: string;
}

// Cronómetro propio para no re-renderizar todo el formulario cada segundo.
const ElapsedTimer = ({ startedAt }: { startedAt: string }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () =>
      setSeconds(
        Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000)),
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <strong>{formatDuration(seconds)}</strong>;
};

const GembaWalkForm = () => {
  const router = useRouter();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [now, setNow] = useState(() => new Date());
  const [manufacturingPlantId, setManufacturingPlantId] = useState("");
  const [gembaWalkCalendarId, setGembaWalkCalendarId] = useState("");
  const [events, setEvents] = useState<GembaWalkCalendar[]>([]);
  const [evaluations, setEvaluations] = useState<GembaWalkEvaluation[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isLoadingPlant, setIsLoadingPlant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [started, setStarted] = useState<StartedWalk | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Fecha y hora del registro (la definitiva la fija el servidor al guardar).
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setEvents([]);
    setEvaluations([]);
    setAnswers({});
    setGembaWalkCalendarId("");
    setStarted(null);

    if (!manufacturingPlantId) return;

    setIsLoadingPlant(true);

    Promise.all([
      GembaWalksService.findAvailableEvents(manufacturingPlantId),
      GembaWalkEvaluationsService.findAll({ manufacturingPlantId }),
    ])
      .then(([eventsData, evaluationsData]) => {
        setEvents(eventsData);
        setEvaluations(evaluationsData);
        // Por defecto todo "Cumple"; el observador marca lo que no cumple.
        setAnswers(
          Object.fromEntries(
            evaluationsData.map(({ id }) => [
              id,
              { isCompliant: true, comments: "" },
            ]),
          ),
        );
      })
      .finally(() => setIsLoadingPlant(false));
  }, [manufacturingPlantId]);

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({ id: event.id, name: eventLabel(event, now) })),
    [events, now],
  );

  const selectedEvent = events.find(
    (event) => String(event.id) === gembaWalkCalendarId,
  );
  // La tolerancia aplica al inicio; una vez iniciado ya no vence.
  const selectedOutOfTime =
    !!selectedEvent && !started && isOutOfTime(selectedEvent, now);

  // En el recorrido se evalúan en orden de captura (ID ascendente).
  const groups = useMemo(
    () => groupByCategory([...evaluations].sort((a, b) => a.id - b.id)),
    [evaluations],
  );

  const nonCompliantCount = Object.values(answers).filter(
    ({ isCompliant }) => !isCompliant,
  ).length;
  const compliantCount = evaluations.length - nonCompliantCount;

  const setAnswer = (id: number, change: Partial<Answer>) =>
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));

  const canSave = !!started && evaluations.length > 0 && !isSaving;

  const startWalk = () => {
    setIsStarting(true);

    GembaWalksService.start(Number(gembaWalkCalendarId))
      .then(setStarted)
      .finally(() => setIsStarting(false));
  };

  const save = () => {
    if (!started) return;

    setIsSaving(true);

    GembaWalksService.create({
      gembaWalkCalendarId: Number(gembaWalkCalendarId),
      startToken: started.startToken,
      results: evaluations.map(({ id }) => ({
        gembaWalkEvaluationId: id,
        isCompliant: answers[id].isCompliant,
        ...(answers[id].comments.trim() && {
          comments: answers[id].comments.trim(),
        }),
      })),
    })
      .then(() => {
        toast.success("Recorrido registrado correctamente");
        router.push("/gemba-walk");
      })
      .finally(() => setIsSaving(false));
  };

  const confirmSave = async () => {
    const confirmed = await confirm({
      title: "Confirmar registro",
      description: `Se registrará el recorrido con ${compliantCount} C y ${nonCompliantCount} NC. Una vez guardado no se puede editar ni eliminar.`,
      confirmLabel: "Registrar",
    });

    if (confirmed) save();
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <AccessTimeIcon sx={secondaryTextColor} />
          <Typography variant="body1" sx={textColor}>
            Fecha y hora actual:{" "}
            <strong>{dayjs(now).format("DD/MM/YYYY HH:mm")}</strong>
          </Typography>
        </Stack>
      </Grid>
      <SelectManufacturingPlantsOwn
        value={manufacturingPlantId}
        onChange={(e) => setManufacturingPlantId(e.target.value)}
      />
      <Grid size={{ xs: 12, sm: 6, md: 6 }}>
        <SelectDefault
          data={eventOptions}
          label="Recorrido programado (hoy)"
          value={gembaWalkCalendarId}
          onChange={(e) => {
            setGembaWalkCalendarId(e.target.value);
            setStarted(null);
          }}
          disabled={!manufacturingPlantId || !events.length || !!started}
          validationEmpty={!!manufacturingPlantId && events.length > 0}
        />
      </Grid>

      {isLoadingPlant && (
        <Grid size={{ xs: 12 }}>
          <LoadingLinear />
        </Grid>
      )}

      {manufacturingPlantId && !isLoadingPlant && !events.length && (
        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            No hay recorridos programados para hoy en esta planta, o ya fueron
            registrados.
          </Alert>
        </Grid>
      )}

      {selectedEvent && (
        <Grid size={{ xs: 12 }}>
          {started ? (
            <Alert severity="success">
              Recorrido iniciado a las{" "}
              <strong>{dayjs(started.startedAt).format("HH:mm:ss")}</strong> ·
              Tiempo transcurrido:{" "}
              <ElapsedTimer startedAt={started.startedAt} />
            </Alert>
          ) : selectedOutOfTime ? (
            <Alert severity="error">
              <strong>Fuera de tiempo.</strong> El recorrido estaba programado a
              las {dayjs(selectedEvent.scheduledAt).format("HH:mm")} y la
              tolerancia de {TOLERANCE_MINUTES} minutos para iniciarlo terminó a
              las {deadlineOf(selectedEvent).format("HH:mm")}. Ya no se puede
              realizar.
            </Alert>
          ) : (
            <Alert
              severity="info"
              action={
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  loading={isStarting}
                  loadingPosition="start"
                  disabled={isStarting || !evaluations.length}
                  onClick={startWalk}
                >
                  Iniciar recorrido
                </Button>
              }
            >
              Puedes iniciar este recorrido hasta las{" "}
              <strong>{deadlineOf(selectedEvent).format("HH:mm")}</strong>. El
              tiempo empieza a contar al iniciar.
            </Alert>
          )}
        </Grid>
      )}

      {manufacturingPlantId && !isLoadingPlant && !evaluations.length && (
        <Grid size={{ xs: 12 }}>
          <Alert severity="warning">
            La planta no tiene conceptos de evaluación registrados.
          </Alert>
        </Grid>
      )}

      {started && evaluations.length > 0 && (
        <>
          <Grid size={{ xs: 12 }}>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: "wrap", alignItems: "center" }}
            >
              <Typography variant="body2" sx={secondaryTextColor}>
                Marca el switch en <strong>No cumple</strong> en los conceptos
                que no se cumplan y agrega un comentario.
              </Typography>
              <Chip
                size="small"
                color="success"
                label={`C: ${compliantCount}`}
              />
              <Chip
                size="small"
                color={nonCompliantCount ? "error" : "default"}
                label={`NC: ${nonCompliantCount}`}
              />
            </Stack>
          </Grid>

          {groups.map(({ category, items }) => (
            <Grid size={{ xs: 12 }} key={category}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: (theme) => theme.palette.primary.main,
                  }}
                >
                  {category}
                </Typography>
                <Stack spacing={2}>
                  {items.map((evaluation) => {
                    const answer = answers[evaluation.id];
                    if (!answer) return null;

                    return (
                      <Box
                        key={evaluation.id}
                        sx={(theme) => ({
                          p: 2,
                          borderRadius: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          borderLeft: `6px solid ${
                            answer.isCompliant
                              ? theme.palette.success.main
                              : theme.palette.error.main
                          }`,
                        })}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600, ...textColor }}
                          >
                            {evaluation.area}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: answer.isCompliant ? 400 : 700,
                                color: (theme) =>
                                  answer.isCompliant
                                    ? theme.palette.text.secondary
                                    : theme.palette.error.main,
                              }}
                            >
                              NC
                            </Typography>
                            <Switch
                              color="success"
                              checked={answer.isCompliant}
                              onChange={(e) =>
                                setAnswer(evaluation.id, {
                                  isCompliant: e.target.checked,
                                })
                              }
                              slotProps={{
                                input: {
                                  "aria-label": `${evaluation.area}: cumple`,
                                },
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: answer.isCompliant ? 700 : 400,
                                color: (theme) =>
                                  answer.isCompliant
                                    ? theme.palette.success.main
                                    : theme.palette.text.secondary,
                              }}
                            >
                              C
                            </Typography>
                            <Chip
                              size="small"
                              color={answer.isCompliant ? "success" : "error"}
                              label={
                                answer.isCompliant ? "Cumple" : "No cumple"
                              }
                              sx={{ minWidth: 92 }}
                            />
                          </Stack>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{ mt: 1, mb: 2, ...secondaryTextColor }}
                        >
                          {evaluation.description}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          minRows={1}
                          label="Comentarios"
                          placeholder={
                            answer.isCompliant
                              ? "Opcional"
                              : "Describe qué no se cumple"
                          }
                          value={answer.comments}
                          slotProps={{ htmlInput: { maxLength: 1000 } }}
                          onChange={(e) =>
                            setAnswer(evaluation.id, {
                              comments: e.target.value,
                            })
                          }
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </>
      )}

      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CloseIcon />}
          onClick={() => router.push("/gemba-walk")}
        >
          Cancelar
        </Button>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
        <Button
          loading={isSaving}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
          color="primary"
          fullWidth
          onClick={confirmSave}
          disabled={!canSave}
        >
          Terminar recorrido
        </Button>
      </Grid>
      {confirmDialog}
    </Grid>
  );
};

const GembaWalkFormPage = () => (
  <>
    <PageHeader title="Registrar recorrido" />
    <GembaWalkAccessGuard>
      <GembaWalkForm />
    </GembaWalkAccessGuard>
  </>
);

export default GembaWalkFormPage;
