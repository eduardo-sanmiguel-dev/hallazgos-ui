"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "next/navigation";

import { Grid } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import { Stack } from "@mui/material";
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
import { alpha } from "@mui/material/styles";
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
import DetailSection from "@shared/components/DetailSection";
import ComplianceMeter from "../_components/ComplianceMeter";
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
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirmDialog();

  // Lecturas al elegir planta o al revalidar: siempre lo último (sin caché).
  const fetchAvailableEvents = useCallback(
    (plantId: string) =>
      queryClient.fetchQuery({
        queryKey: ["gemba-walk", "available-events", plantId],
        queryFn: () => GembaWalksService.findAvailableEvents(plantId),
        staleTime: 0,
      }),
    [queryClient],
  );

  const [now, setNow] = useState(() => new Date());
  const [manufacturingPlantId, setManufacturingPlantId] = useState("");
  const [gembaWalkCalendarId, setGembaWalkCalendarId] = useState("");
  const [events, setEvents] = useState<GembaWalkCalendar[]>([]);
  const [evaluations, setEvaluations] = useState<GembaWalkEvaluation[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [isLoadingPlant, setIsLoadingPlant] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [started, setStarted] = useState<StartedWalk | null>(null);
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
      fetchAvailableEvents(manufacturingPlantId),
      queryClient.fetchQuery({
        queryKey: ["gemba-walk-evaluations", "plant", manufacturingPlantId],
        queryFn: () =>
          GembaWalkEvaluationsService.findAll({ manufacturingPlantId }),
        staleTime: 0,
      }),
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
  }, [manufacturingPlantId, loadCount, queryClient, fetchAvailableEvents]);

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

  const startMutation = useMutation({
    mutationFn: (calendarId: number) => GembaWalksService.start(calendarId),
    onSuccess: setStarted,
  });
  const isStarting = startMutation.isPending;

  const startWalk = () => startMutation.mutate(Number(gembaWalkCalendarId));

  // Vuelve a consultar los eventos disponibles sin tocar lo capturado.
  const refreshAvailability = () =>
    fetchAvailableEvents(manufacturingPlantId)
      .then((eventsData) => setAvailableIds(eventsData.map(({ id }) => id)))
      .catch(() => undefined);

  const createMutation = useMutation({
    mutationFn: async (
      payload: Parameters<typeof GembaWalksService.create>[0],
    ) => {
      // Queda como envío pendiente, con su clave: si se pierde la señal,
      // reenviarlo no registra dos veces.
      await draft.markSending();
      return GembaWalksService.create(payload, {
        idempotencyKey: draft.key(),
      });
    },
    onSuccess: async ({ data, replayed }) => {
      await draft.settle();
      toast.success(
        replayed
          ? `Ya se había registrado (recorrido #${data.id})`
          : "Recorrido registrado correctamente",
      );
      router.push("/gemba-walk");
    },
    onError: async (error) => {
      await draft.settle(error);
      // Quizá otro observador lo registró: si es así, se muestra el motivo.
      refreshAvailability();
    },
  });
  const isSaving = createMutation.isPending;

  const send = () => {
    if (!started) return;

    createMutation.mutate({
      gembaWalkCalendarId: Number(gembaWalkCalendarId),
      startToken: started.startToken,
      results: evaluations.map(({ id }) => ({
        gembaWalkEvaluationId: id,
        isCompliant: answers[id].isCompliant,
        ...(answers[id].comments.trim() && {
          comments: answers[id].comments.trim(),
        }),
      })),
    });
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
      // Lo último que se capturó puede no haberse guardado todavía.
      await draft.flush();
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

  // Pasos en orden: elegir el recorrido (y su estado: iniciar, fuera de
  // tiempo o el cronómetro), evaluar por categoría y, en la barra fija,
  // el cumplimiento en vivo con las acciones.
  return (
    <Box>
      <Stack spacing={3}>
        {(draft.offer || draft.lock) && (
          <DraftNotice
            offer={draft.offer}
            lock={draft.lock}
            onRestore={draft.restore}
            onDiscard={discardDraft}
            onRetry={send}
            isSending={isSaving}
          />
        )}
        {blocked && !draft.lock && (
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
        )}

        <DetailSection
          title="Recorrido de hoy"
          description="Elige la planta y el recorrido programado."
          action={
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center", color: "text.secondary" }}
            >
              <AccessTimeIcon fontSize="small" aria-hidden />
              <Typography variant="body2">
                Fecha y hora actual:{" "}
                <Box component="strong" sx={{ color: "text.primary" }}>
                  {dayjs(now).format("DD/MM/YYYY HH:mm")}
                </Box>
              </Typography>
            </Stack>
          }
        >
          <Grid container spacing={2}>
            <SelectManufacturingPlantsOwn
              value={manufacturingPlantId}
              onChange={(e) => setManufacturingPlantId(e.target.value)}
              disabled={!!started}
            />
            <Grid size={{ xs: 12, sm: 6, md: 9 }}>
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
          </Grid>

          {isLoadingPlant && (
            <Box sx={{ mt: 2 }}>
              <LoadingLinear />
            </Box>
          )}

          {loadError && (
            <Box sx={{ mt: 2 }}>
              <ErrorState
                size="small"
                offline={typeof navigator !== "undefined" && !navigator.onLine}
                onRetry={() => setLoadCount((count) => count + 1)}
              />
            </Box>
          )}

          {manufacturingPlantId &&
            !isLoadingPlant &&
            !loadError &&
            !events.length &&
            !started && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No hay recorridos programados para hoy en esta planta, o ya
                fueron registrados.
              </Alert>
            )}

          {manufacturingPlantId &&
            !isLoadingPlant &&
            !loadError &&
            !evaluations.length && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                La planta no tiene conceptos de evaluación registrados.
              </Alert>
            )}

          {/* Estado del recorrido elegido. */}
          {(selectedEvent || started) && !blocked && (
            <Box sx={{ mt: 2 }}>
              {started ? (
                <Box
                  role="status"
                  sx={(theme) => ({
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.success.main}`,
                    backgroundColor: alpha(theme.palette.success.main, 0.08),
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  })}
                >
                  <Box sx={{ minWidth: 0 }}>
                    {draftEvent && (
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {draftEvent.label}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Recorrido iniciado a las{" "}
                      <strong>
                        {dayjs(started.startedAt).format("HH:mm:ss")}
                      </strong>
                    </Typography>
                  </Box>
                  <Stack
                    sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      Tiempo transcurrido
                    </Typography>
                    <Typography
                      component="p"
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.1,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <ElapsedTimer startedAt={started.startedAt} />
                    </Typography>
                  </Stack>
                </Box>
              ) : selectedOutOfTime && selectedEvent ? (
                <Alert severity="error">
                  <strong>Fuera de tiempo.</strong> El recorrido estaba
                  programado a las{" "}
                  {dayjs(selectedEvent.scheduledAt).format("HH:mm")} y la
                  tolerancia de {TOLERANCE_MINUTES} minutos para iniciarlo
                  terminó a las {deadlineOf(selectedEvent).format("HH:mm")}. Ya
                  no se puede realizar.
                </Alert>
              ) : (
                selectedEvent && (
                  <Box
                    sx={(theme) => ({
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.info.main}`,
                      backgroundColor: alpha(theme.palette.info.main, 0.06),
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { sm: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                    })}
                  >
                    <Typography variant="body2">
                      Puedes iniciar este recorrido hasta las{" "}
                      <strong>
                        {deadlineOf(selectedEvent).format("HH:mm")}
                      </strong>
                      . El tiempo empieza a contar al iniciar.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrowIcon />}
                      loading={isStarting}
                      loadingPosition="start"
                      disabled={isStarting || !evaluations.length}
                      onClick={startWalk}
                      sx={{ flexShrink: 0, minWidth: { sm: 220 } }}
                    >
                      Iniciar recorrido
                    </Button>
                  </Box>
                )
              )}
            </Box>
          )}
        </DetailSection>

        {started && evaluations.length > 0 && (
          <DetailSection
            title="Evaluación"
            description={
              <>
                Todo inicia en <strong>Cumple</strong>: marca{" "}
                <strong>No cumple</strong> en los conceptos que no se cumplan y
                agrega un comentario.
              </>
            }
          >
            <Stack spacing={3}>
              {groups.map(({ category, items }) => {
                const groupNonCompliant = items.filter(
                  ({ id }) => answers[id] && !answers[id].isCompliant,
                ).length;

                return (
                  <Box component="section" key={category}>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        mb: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        component="h2"
                        sx={{ fontWeight: 700, color: "text.brand" }}
                      >
                        {category}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: groupNonCompliant
                            ? "error.main"
                            : "text.secondary",
                          fontWeight: groupNonCompliant ? 700 : 400,
                        }}
                      >
                        {items.length - groupNonCompliant} de {items.length}{" "}
                        cumplen
                      </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                      {items.map((evaluation) => {
                        const answer = answers[evaluation.id];
                        if (!answer) return null;

                        return (
                          <Box
                            key={evaluation.id}
                            sx={(theme) => ({
                              p: { xs: 1.5, sm: 2 },
                              borderRadius: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderLeft: `6px solid ${
                                answer.isCompliant
                                  ? theme.palette.success.main
                                  : theme.palette.error.main
                              }`,
                              // Lo que no cumple resalta al recorrer la lista.
                              backgroundColor: answer.isCompliant
                                ? "transparent"
                                : alpha(theme.palette.error.main, 0.06),
                              transition: "background-color 150ms",
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
                              <Box sx={{ minWidth: 0, flex: "1 1 220px" }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 700 }}
                                >
                                  {evaluation.area}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {evaluation.description}
                                </Typography>
                              </Box>
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
                                sx={{
                                  width: { xs: "100%", sm: "auto" },
                                  backgroundColor: "background.paper",
                                }}
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
                              sx={{
                                mt: 1.5,
                                "& .MuiInputBase-root": {
                                  backgroundColor: "background.paper",
                                },
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </DetailSection>
        )}
      </Stack>

      {/* Al pie y siempre a la vista: cumplimiento en vivo y acciones (G4,
          G9). Sticky en este contenedor (todo el formulario), así la barra
          se queda abajo mientras se desplaza. */}
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 2, mt: 3 }}>
        <Paper
          elevation={3}
          sx={(theme) => ({
            p: 1.5,
            pb: "calc(12px + env(safe-area-inset-bottom))",
            borderTop: `2px solid ${theme.palette.primary.main}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { sm: "center" },
            gap: 1.5,
          })}
        >
          {started && evaluations.length > 0 && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ComplianceMeter
                variant="compact"
                compliant={compliantCount}
                nonCompliant={nonCompliantCount}
              />
            </Box>
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
      </Box>
      {confirmDialog}
    </Box>
  );
};

// Ancho máximo en escritorio, con el título alineado al contenido (como
// "Nuevo hallazgo").
const GembaWalkFormPage = () => (
  <Box sx={{ maxWidth: 960, mx: "auto" }}>
    <PageHeader title="Registrar recorrido" />
    <GembaWalkAccessGuard>
      <GembaWalkForm />
    </GembaWalkAccessGuard>
  </Box>
);

export default GembaWalkFormPage;
