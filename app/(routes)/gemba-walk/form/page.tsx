"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
import { Chip } from "@mui/material";
import { Alert } from "@mui/material";
import { AlertTitle } from "@mui/material";
import { TextField } from "@mui/material";
import { ToggleButton } from "@mui/material";
import { ToggleButtonGroup } from "@mui/material";
import { Typography } from "@mui/material";
import { Button } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import type { Theme } from "@mui/material/styles";
import { toast } from "sonner";
import dayjs from "@shared/libs/dayjs";

import { GembaWalkEvaluationsService, GembaWalksService } from "@services";
import { GembaWalkCalendar, GembaWalkEvaluation } from "@interfaces";
import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import SelectDefault from "@components/SelectDefault";
import LoadingLinear from "@shared/components/LoadingLinear";
import ErrorState from "@shared/components/ErrorState";
import DraftNotice from "@shared/components/DraftNotice";
import FormActions from "@shared/components/FormActions";
import { useConfirmDialog } from "@shared/components/ConfirmDialog";
import { useFormDraft } from "@hooks/useFormDraft";
import { isDraftStorageAvailable } from "@shared/drafts/draftStore";
import GembaWalkAccessGuard from "../_components/GembaWalkAccessGuard";
import PageHeader from "@shared/components/PageHeader";
import { groupByCategory } from "../_components/groupByCategory";
import { formatDuration } from "../_components/formatDuration";
import {
  type Answer,
  type StartedWalk,
  type WalkDraftFields,
  blockedReason,
  eventSummary,
  initialAnswers,
} from "./_lib/walkDraft";

// Igual que la API (GEMBA_WALK_TOLERANCE_MINUTES): se puede INICIAR desde el
// inicio del día hasta 15 minutos después de la hora programada; puede
// terminarse después.
const TOLERANCE_MINUTES = 15;

const deadlineOf = (event: GembaWalkCalendar) =>
  dayjs(event.scheduledAt).add(TOLERANCE_MINUTES, "minute");

const isOutOfTime = (event: GembaWalkCalendar, now: Date) =>
  dayjs(now).isAfter(deadlineOf(event));

const eventLabel = (event: GembaWalkCalendar, now: Date) =>
  `${eventSummary(event)}${isOutOfTime(event, now) ? " — Fuera de tiempo" : ""}`;

const textColor = { color: (theme: Theme) => theme.palette.text.primary };
const secondaryTextColor = {
  color: (theme: Theme) => theme.palette.text.secondary,
};

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
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [started, setStarted] = useState<StartedWalk | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  // Eventos de hoy sin recorrido (null: aún no se sabe o no se pudo saber).
  const [availableIds, setAvailableIds] = useState<number[] | null>(null);
  // Evento del borrador recuperado, por si ya no está entre los disponibles.
  const [restoredEvent, setRestoredEvent] =
    useState<WalkDraftFields["event"]>(null);
  // Recarga de la planta (recuperar o descartar un borrador, "Reintentar").
  const [loadCount, setLoadCount] = useState(0);
  // Borrador por aplicar cuando carguen los datos de su planta.
  const restoreRef = useRef<WalkDraftFields | null>(null);

  // Fecha y hora del registro (la definitiva la fija el servidor al guardar).
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const restoring = restoreRef.current;
    let ignore = false;

    setEvents([]);
    setEvaluations([]);
    setAvailableIds(null);
    setLoadError(false);
    // Lo recuperado se pone desde ya: el borrador se sigue guardando
    // mientras carga y no debe quedar vacío.
    setAnswers(restoring?.answers ?? {});
    setGembaWalkCalendarId(restoring?.gembaWalkCalendarId ?? "");
    setStarted(restoring?.started ?? null);

    if (!manufacturingPlantId) return;

    setIsLoadingPlant(true);

    Promise.all([
      GembaWalksService.findAvailableEvents(manufacturingPlantId),
      GembaWalkEvaluationsService.findAll({ manufacturingPlantId }),
    ])
      .then(([eventsData, evaluationsData]) => {
        if (ignore) return;
        restoreRef.current = null;
        setEvents(eventsData);
        setAvailableIds(eventsData.map(({ id }) => id));
        setEvaluations(evaluationsData);
        // Por defecto todo "Cumple"; el observador marca lo que no cumple.
        setAnswers(initialAnswers(evaluationsData, restoring?.answers));
      })
      .catch(() => {
        if (!ignore) setLoadError(true);
      })
      .finally(() => {
        if (!ignore) setIsLoadingPlant(false);
      });

    return () => {
      ignore = true;
    };
  }, [manufacturingPlantId, loadCount]);

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({ id: event.id, name: eventLabel(event, now) })),
    [events, now],
  );

  const selectedEvent = events.find(
    (event) => String(event.id) === gembaWalkCalendarId,
  );
  const draftEvent = selectedEvent
    ? {
        scheduledAt: String(selectedEvent.scheduledAt),
        label: eventSummary(selectedEvent),
      }
    : restoredEvent;

  // Borrador local (G1): solo de un recorrido iniciado, con su comprobante y
  // su hora de inicio. Se conserva aunque pase la tolerancia: el API la
  // revisa con la hora de inicio, no con la de registro.
  const draftFields: WalkDraftFields = {
    manufacturingPlantId,
    gembaWalkCalendarId,
    started,
    answers,
    event: draftEvent,
  };
  const draft = useFormDraft<WalkDraftFields>({
    form: "gemba-walk",
    content: { fields: draftFields, photo: null },
    hasContent: ({ fields }) => !!fields.started,
    onRestore: ({ fields }) => {
      restoreRef.current = fields;
      setRestoredEvent(fields.event);
      setManufacturingPlantId(fields.manufacturingPlantId);
      setLoadCount((count) => count + 1);
    },
  });

  // Ya no se puede registrar (otro día, comprobante vencido o ya registrado).
  const blocked = isLoadingPlant
    ? null
    : blockedReason(draftFields, availableIds, now);
  const isReadOnly = !!draft.lock || !!blocked;

  // La tolerancia aplica al inicio; una vez iniciado ya no vence.
  const selectedOutOfTime =
    !!selectedEvent && !started && isOutOfTime(selectedEvent, now);

  // En el recorrido se evalúan en orden de captura (ID ascendente).
  const groups = useMemo(
    () => groupByCategory([...evaluations].sort((a, b) => a.id - b.id)),
    [evaluations],
  );

  const nonCompliantCount = evaluations.filter(
    ({ id }) => answers[id] && !answers[id].isCompliant,
  ).length;
  const compliantCount = evaluations.length - nonCompliantCount;

  const setAnswer = (id: number, change: Partial<Answer>) =>
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }));

  const canSave = !!started && evaluations.length > 0 && !isReadOnly;

  const startWalk = () => {
    setIsStarting(true);

    GembaWalksService.start(Number(gembaWalkCalendarId))
      .then(setStarted)
      .finally(() => setIsStarting(false));
  };

  // Vuelve a consultar los eventos disponibles sin tocar lo capturado.
  const refreshAvailability = () =>
    GembaWalksService.findAvailableEvents(manufacturingPlantId)
      .then((eventsData) => setAvailableIds(eventsData.map(({ id }) => id)))
      .catch(() => undefined);

  const send = async () => {
    if (!started) return;

    setIsSaving(true);
    // Queda como envío pendiente, con su clave: si se pierde la señal,
    // reenviarlo no registra dos veces.
    await draft.markSending();

    GembaWalksService.create(
      {
        gembaWalkCalendarId: Number(gembaWalkCalendarId),
        startToken: started.startToken,
        results: evaluations.map(({ id }) => ({
          gembaWalkEvaluationId: id,
          isCompliant: answers[id].isCompliant,
          ...(answers[id].comments.trim() && {
            comments: answers[id].comments.trim(),
          }),
        })),
      },
      { idempotencyKey: draft.key() },
    )
      .then(async ({ data, replayed }) => {
        await draft.settle();
        toast.success(
          replayed
            ? `Ya se había registrado (recorrido #${data.id})`
            : "Recorrido registrado correctamente",
        );
        router.push("/gemba-walk");
      })
      .catch(async (error) => {
        await draft.settle(error);
        // Quizá otro observador lo registró: si es así, se muestra el motivo.
        refreshAvailability();
      })
      .finally(() => setIsSaving(false));
  };

  const confirmSave = async () => {
    const confirmed = await confirm({
      title: "Confirmar registro",
      description: `Se registrará el recorrido con ${compliantCount} C y ${nonCompliantCount} NC. Una vez guardado no se puede editar ni eliminar.`,
      confirmLabel: "Registrar",
    });

    if (confirmed) send();
  };

  // Con un recorrido iniciado, salir pide confirmación (G3). Lo capturado
  // queda en el borrador del dispositivo.
  // Sin almacén de borradores (modo privado) no se promete que se guardó.
  const cancel = async () => {
    if (started && !isReadOnly) {
      const saved = await isDraftStorageAvailable();
      const confirmed = await confirm({
        title: "¿Salir del recorrido?",
        description: saved
          ? "Lo que capturaste queda guardado en este dispositivo: al volver a esta pantalla puedes recuperarlo y terminarlo hoy."
          : "Este navegador no permite guardar borradores (por ejemplo, en modo privado): si sales, lo que capturaste se perderá.",
        confirmLabel: "Salir",
        cancelLabel: "Seguir en el recorrido",
        tone: saved ? "default" : "danger",
      });
      if (!confirmed) return;
    }
    router.push("/gemba-walk");
  };

  // Descarta el borrador y deja el formulario como nuevo (misma planta).
  const discardDraft = async () => {
    await draft.discard();
    restoreRef.current = null;
    setRestoredEvent(null);
    setLoadCount((count) => count + 1);
  };

  return (
    <Grid container spacing={2}>
      {(draft.offer || draft.lock) && (
        <Grid size={12}>
          <DraftNotice
            offer={draft.offer}
            lock={draft.lock}
            onRestore={draft.restore}
            onDiscard={discardDraft}
            onRetry={send}
            isSending={isSaving}
          />
        </Grid>
      )}
      {blocked && !draft.lock && (
        <Grid size={12}>
          <Alert severity="warning" role="status">
            <AlertTitle>Este recorrido ya no se puede registrar</AlertTitle>
            {draftEvent && <strong>{draftEvent.label}. </strong>}
            {blocked} Lo capturado queda solo para consulta.
            <Box sx={{ mt: 1.5 }}>
              <Button
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={discardDraft}
              >
                Descartar recorrido
              </Button>
            </Box>
          </Alert>
        </Grid>
      )}
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
        disabled={!!started}
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

      {loadError && (
        <Grid size={{ xs: 12 }}>
          <ErrorState
            offline={typeof navigator !== "undefined" && !navigator.onLine}
            onRetry={() => setLoadCount((count) => count + 1)}
          />
        </Grid>
      )}

      {manufacturingPlantId &&
        !isLoadingPlant &&
        !loadError &&
        !events.length &&
        !started && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">
              No hay recorridos programados para hoy en esta planta, o ya fueron
              registrados.
            </Alert>
          </Grid>
        )}

      {(selectedEvent || started) && !blocked && (
        <Grid size={{ xs: 12 }}>
          {started ? (
            <Alert severity="success">
              {draftEvent && <strong>{draftEvent.label} · </strong>}
              Recorrido iniciado a las{" "}
              <strong>{dayjs(started.startedAt).format("HH:mm:ss")}</strong> ·
              Tiempo transcurrido:{" "}
              <ElapsedTimer startedAt={started.startedAt} />
            </Alert>
          ) : selectedOutOfTime && selectedEvent ? (
            <Alert severity="error">
              <strong>Fuera de tiempo.</strong> El recorrido estaba programado a
              las {dayjs(selectedEvent.scheduledAt).format("HH:mm")} y la
              tolerancia de {TOLERANCE_MINUTES} minutos para iniciarlo terminó a
              las {deadlineOf(selectedEvent).format("HH:mm")}. Ya no se puede
              realizar.
            </Alert>
          ) : (
            selectedEvent && (
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
            )
          )}
        </Grid>
      )}

      {manufacturingPlantId &&
        !isLoadingPlant &&
        !loadError &&
        !evaluations.length && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="warning">
              La planta no tiene conceptos de evaluación registrados.
            </Alert>
          </Grid>
        )}

      {started && evaluations.length > 0 && (
        <>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={secondaryTextColor}>
              Todo inicia en <strong>Cumple</strong>: marca{" "}
              <strong>No cumple</strong> en los conceptos que no se cumplan y
              agrega un comentario.
            </Typography>
          </Grid>

          {groups.map(({ category, items }) => (
            <Grid size={{ xs: 12 }} key={category}>
              <Paper sx={{ p: 2 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 2, color: "text.brand" }}
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
                          {/* Dos botones grandes en lugar de un switch (G4). */}
                          <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={answer.isCompliant ? "C" : "NC"}
                            onChange={(_, value: "C" | "NC" | null) => {
                              if (value) {
                                setAnswer(evaluation.id, {
                                  isCompliant: value === "C",
                                });
                              }
                            }}
                            disabled={isReadOnly}
                            aria-label={evaluation.area}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            <ToggleButton
                              value="C"
                              color="success"
                              sx={{ flex: 1, minWidth: 120, gap: 0.5 }}
                            >
                              <CheckIcon fontSize="small" />
                              Cumple
                            </ToggleButton>
                            <ToggleButton
                              value="NC"
                              color="error"
                              sx={{ flex: 1, minWidth: 120, gap: 0.5 }}
                            >
                              <CloseIcon fontSize="small" />
                              No cumple
                            </ToggleButton>
                          </ToggleButtonGroup>
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
                          slotProps={{
                            htmlInput: { maxLength: 1000 },
                            input: { readOnly: isReadOnly },
                          }}
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

      {/* Al pie y siempre a la vista: conteo y acciones (G4, G9). */}
      {/* Sticky en el Grid (no en el Paper): su contenedor es todo el
          formulario, así la barra se queda abajo mientras se desplaza. */}
      <Grid size={{ xs: 12 }} sx={{ position: "sticky", bottom: 0, zIndex: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom))",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            gap: 1.5,
          }}
        >
          {started && evaluations.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              aria-live="polite"
              sx={{ alignItems: "center", flex: 1 }}
            >
              <Chip color="success" label={`C: ${compliantCount}`} />
              <Chip
                color={nonCompliantCount ? "error" : "default"}
                label={`NC: ${nonCompliantCount}`}
              />
            </Stack>
          )}
          <Box sx={{ flex: { sm: started ? "none" : 1 } }}>
            <FormActions
              onCancel={cancel}
              onSave={confirmSave}
              isSaving={isSaving}
              isSaveDisabled={!canSave}
              saveLabel="Terminar recorrido"
              inline
            />
          </Box>
        </Paper>
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
