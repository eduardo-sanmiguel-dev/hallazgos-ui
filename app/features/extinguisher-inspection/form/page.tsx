import { useEffect, useEffectEvent, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter, useSearchParams } from "@shared/navigation";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import { toast } from "sonner";
import jsQR from "jsqr";
import dayjs from "dayjs";
import "dayjs/locale/es";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import PageHeader from "@shared/components/PageHeader";
import DetailSection from "@shared/components/DetailSection";
import StatusChip from "@shared/components/StatusChip";
import FormActions from "@shared/components/FormActions";
import { useFieldErrors } from "@hooks/useFieldErrors";
import { isEditRecordPending, useEditRecord } from "@hooks/useEditRecord";
import EditRecordState from "@shared/components/EditRecordState";
import { EmergencyTeamsService, ExtinguisherInspectionsService, parseApiError } from "@services";
import { EvaluationValues } from "@interfaces";

import { ExtinguisherInspection, ExtinguisherInspectionEvaluation } from "@interfaces";
import {
  DUPLICATE_EVALUATION_TOAST_ID,
  EvaluationNoveltyRecord,
  GroupedConceptKey,
  GroupedConceptStatus,
  LocalEvaluation,
  evaluationApiErrors,
  getDefaultEvaluationFromEmergencyTeam,
  groupedConceptFields,
  inspectionApiField,
} from "./_lib/evaluation";
import { EvaluationCard } from "./_components/EvaluationCard";

/** Aviso para el error de getUserMedia (permiso, sin cámara, en uso). */
const cameraErrorMessage = (error: unknown) => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") {
    return "Permiso de cámara denegado. Habilítelo en la configuración del navegador.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No se encontró ninguna cámara conectada.";
  }
  if (name === "NotReadableError") {
    return "La cámara está en uso por otra aplicación. Ciérrela e intente de nuevo.";
  }
  return "No se pudo acceder a la cámara. Verifique permisos del navegador.";
};

const ExtinguisherInspectionFormPage = () => {
  const today = dayjs().startOf("day");

  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>("");

  const [form, setForm] = useState({
    manufacturingPlantId: "",
    evaluations: [] as LocalEvaluation[],
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const scanSessionRef = useRef<number>(0);
  const lastScannedValueRef = useRef<string>("");
  const lastScannedAtRef = useRef<number>(0);
  const evaluationsRef = useRef<LocalEvaluation[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  // Errores junto al campo al intentar guardar (como en el resto de los
  // formularios); se quitan al cambiar el dato.
  const { fail, failFromApi, errorOf } = useFieldErrors<"manufacturingPlantId" | "evaluations">(
    form.manufacturingPlantId,
    form.evaluations,
  );
  // Errores del API de cada evaluación (evaluations.N.campo), en su tarjeta.
  // Se quitan en cuanto cambian las evaluaciones.
  const [evaluationErrors, setEvaluationErrors] = useState<{
    byIndex: Record<number, string[]>;
    evaluations: LocalEvaluation[];
  } | null>(null);
  const evaluationErrorsOf = (index: number) =>
    evaluationErrors?.evaluations === form.evaluations
      ? evaluationErrors.byIndex[index]
      : undefined;

  const mapEvaluationToLocal = (evaluation: ExtinguisherInspectionEvaluation): LocalEvaluation => {
    const noveltyRecords = groupedConceptFields
      .filter(
        (field) =>
          evaluation[field.key] === EvaluationValues.NC ||
          evaluation[field.key] === EvaluationValues.NA,
      )
      .map((field) => ({
        conceptKey: field.key,
        status: evaluation[field.key] as GroupedConceptStatus,
      }));

    return {
      emergencyTeamId: evaluation.id,
      location: evaluation.location,
      extinguisherNumber: String(evaluation.extinguisherNumber),
      typeOfExtinguisher: evaluation.typeOfExtinguisher,
      capacity: String(evaluation.capacity),
      pressureManometer: evaluation.pressureManometer,
      valve: evaluation.valve,
      hose: evaluation.hose,
      cylinder: evaluation.cylinder,
      barrette: evaluation.barrette,
      seal: evaluation.seal,
      cornet: evaluation.cornet,
      access: evaluation.access,
      support: evaluation.support,
      signaling: evaluation.signaling,
      noveltyRecords,
      nextRechargeDate: evaluation.nextRechargeDate?.slice(0, 10) || "",
      maintenanceDate: evaluation.maintenanceDate?.slice(0, 10) || "",
      observations: evaluation.observations || "",
    };
  };

  const queryClient = useQueryClient();

  const cancel = () => {
    router.push("/extinguisher-inspection");
  };

  // Inspección que se edita (?id=): se agregan evaluaciones a las suyas. Se
  // calcula en el render (antes se copiaba a un estado con un efecto, que
  // agregaba un render al abrir).
  const idCurrent = Number(searchParams.get("id") || 0);
  const record = useEditRecord(
    "extinguisher-inspection",
    idCurrent,
    ExtinguisherInspectionsService.findOne,
    (inspection: ExtinguisherInspection) => {
      setForm({
        manufacturingPlantId: String(inspection.manufacturingPlant?.id || ""),
        evaluations: (inspection.evaluations || []).map(mapEvaluationToLocal),
      });
    },
  );

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ExtinguisherInspectionsService.create>[0]) =>
      idCurrent
        ? ExtinguisherInspectionsService.update(idCurrent, payload)
        : ExtinguisherInspectionsService.create(payload),
    onSuccess: () => {
      toast.success(
        idCurrent ? "Evaluaciones agregadas correctamente" : "Inspección creada correctamente",
      );
      cancel();
    },
    // El aviso lo muestra el interceptor; aquí se marca dónde corregir.
    onError: (error) => {
      failFromApi(error, inspectionApiField);
      const byIndex = evaluationApiErrors(parseApiError(error).fieldErrors);
      setEvaluationErrors({ byIndex, evaluations: form.evaluations });
      const first = Object.keys(byIndex)[0];
      if (first !== undefined) {
        document
          .getElementById(`evaluacion-${first}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  });
  // La carga de la inspección la cubre EditRecordState; aquí, al guardar.
  const isLoading = saveMutation.isPending;

  const stopScanner = () => {
    scanningRef.current = false;
    // Invalidate any getUserMedia request still pending.
    scanSessionRef.current += 1;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const attachStreamToVideo = () => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || video.srcObject === stream) {
      return;
    }

    video.srcObject = stream;
    video.play().catch(() => {
      // autoPlay will retry; ignore interrupted play() calls.
    });
  };

  // The Dialog mounts its content after the effect that requests the camera,
  // so attach the stream whenever the <video> element becomes available.
  const setVideoRef = (node: HTMLVideoElement | null) => {
    videoRef.current = node;
    attachStreamToVideo();
  };

  const detectWithJsQr = () => {
    if (!videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: "dontInvert",
    });

    return code?.data || null;
  };

  const parseQrToEmergencyTeamId = (rawValue: string) => {
    const onlyNumber = rawValue.trim();
    if (/^\d+$/.test(onlyNumber)) {
      return Number(onlyNumber);
    }

    const match = rawValue.match(/\d+/);
    if (match) {
      return Number(match[0]);
    }

    return null;
  };

  // Fuera del try/catch de handleDetectedQr: React Compiler no optimiza
  // condicionales dentro de un try y dejaba sin optimizar todo el formulario.
  const addScannedTeam = async (emergencyTeamId: number) => {
    // Lectura al escanear: se pide en ese momento (sin caché vieja).
    const emergencyTeam = await queryClient.fetchQuery({
      queryKey: ["emergency-teams", emergencyTeamId],
      queryFn: () => EmergencyTeamsService.findOne(emergencyTeamId),
      staleTime: 0,
    });

    if (!form.manufacturingPlantId) {
      toast.error("Seleccione una planta antes de crear una evaluación");
      return;
    }

    if (Number(form.manufacturingPlantId) !== emergencyTeam.manufacturingPlant?.id) {
      toast.error("El equipo escaneado pertenece a una planta diferente a la seleccionada");
      return;
    }

    const emergencyTeamExtinguisherNumber = String(emergencyTeam.extinguisherNumber);

    const alreadyExists = evaluationsRef.current.some(
      (evaluation) =>
        evaluation.emergencyTeamId === emergencyTeam.id ||
        evaluation.extinguisherNumber === emergencyTeamExtinguisherNumber,
    );

    if (alreadyExists) {
      setIsScannerOpen(false);
      stopScanner();
      toast.error("Ese equipo ya fue agregado en las evaluaciones", {
        id: DUPLICATE_EVALUATION_TOAST_ID,
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      evaluations: [getDefaultEvaluationFromEmergencyTeam(emergencyTeam), ...prev.evaluations],
    }));

    setIsScannerOpen(false);
    stopScanner();
    toast.success(`Equipo #${emergencyTeam.id} agregado a la inspección`);
  };

  const handleDetectedQr = async (rawValue: string) => {
    const emergencyTeamId = parseQrToEmergencyTeamId(rawValue);

    if (!emergencyTeamId) {
      toast.error("El QR no contiene un ID válido");
      return;
    }

    try {
      await addScannedTeam(emergencyTeamId);
    } catch {
      toast.error("No se pudo obtener el equipo de emergencia desde el QR");
    }
  };

  // Un cuadro del video: un error del detector se ignora y se sigue
  // escaneando. Los try/catch van en funciones aparte, sin condicionales
  // adentro: React Compiler no los soporta y dejaba sin optimizar el formulario.
  const readQrFrame = () => {
    try {
      return detectWithJsQr();
    } catch {
      return null;
    }
  };

  const openCamera = async (session: number) => {
    // El aviso lo pone openScanner (sin setState síncrono en el efecto).
    if (!navigator.mediaDevices?.getUserMedia) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });

    // The scanner was closed (or restarted) while waiting for the camera.
    if (session !== scanSessionRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    scanningRef.current = true;
    attachStreamToVideo();

    const scanFrame = async () => {
      if (!scanningRef.current) {
        return;
      }

      if (!videoRef.current) {
        requestAnimationFrame(scanFrame);
        return;
      }

      const rawValue = readQrFrame();

      if (rawValue) {
        const normalizedValue = rawValue.trim();
        const now = Date.now();
        const isRepeatedScan =
          normalizedValue === lastScannedValueRef.current && now - lastScannedAtRef.current < 2000;

        if (!isRepeatedScan) {
          lastScannedValueRef.current = normalizedValue;
          lastScannedAtRef.current = now;
          try {
            await handleDetectedQr(rawValue);
            return;
          } catch {
            // Como un error del detector: se sigue escaneando.
          }
        }
      }

      requestAnimationFrame(scanFrame);
    };

    requestAnimationFrame(scanFrame);
  };

  const startScanner = async () => {
    lastScannedValueRef.current = "";
    lastScannedAtRef.current = 0;

    const session = scanSessionRef.current;

    try {
      await openCamera(session);
    } catch (error) {
      // Cerrado (o reiniciado) mientras esperaba la cámara: sin aviso.
      if (session === scanSessionRef.current) setScannerError(cameraErrorMessage(error));
    }
  };

  const openScanner = () => {
    if (!form.manufacturingPlantId) {
      toast.error("Seleccione una planta antes de crear evaluación");
      return;
    }

    // Al abrir (evento) y no en el efecto que arranca la cámara.
    setScannerError(
      typeof navigator.mediaDevices?.getUserMedia === "function"
        ? ""
        : "El navegador no permite usar la cámara en este sitio. Use HTTPS o localhost.",
    );
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    stopScanner();
  };

  useEffect(() => {
    evaluationsRef.current = form.evaluations;
  }, [form.evaluations]);

  // Effect events: el escáner solo reacciona a abrir y cerrar, con las
  // funciones del render actual. Antes se desactivaba exhaustive-deps, y con
  // una regla desactivada React Compiler no optimizaba ninguna parte del
  // formulario (una tarjeta por extintor).
  const startScanning = useEffectEvent(() => {
    void startScanner();
  });
  const stopScanning = useEffectEvent(() => stopScanner());

  // startScanner solo cambia estado después de esperar la cámara (sistema
  // externo): el aviso de la regla no aplica.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    if (!isScannerOpen) {
      stopScanning();
      return;
    }

    startScanning();

    return () => stopScanning();
  }, [isScannerOpen]);
  /* oxlint-enable react/set-state-in-effect */

  const removeEvaluation = (index: number) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.filter((_, idx) => idx !== index),
    }));
  };

  const updateDate = (
    index: number,
    field: "nextRechargeDate" | "maintenanceDate",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((evaluation, idx) =>
        idx === index ? { ...evaluation, [field]: value } : evaluation,
      ),
    }));
  };

  const updateObservations = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((evaluation, idx) =>
        idx === index ? { ...evaluation, observations: value } : evaluation,
      ),
    }));
  };

  // Estado de un concepto: C quita la novedad (se envía como C); NC o NA la
  // agrega o la cambia. Mismos datos que antes con "Agregar" y "Quitar".
  const setConceptStatus = (
    index: number,
    conceptKey: GroupedConceptKey,
    status: EvaluationValues,
  ) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((evaluation, idx) => {
        if (idx !== index) return evaluation;

        const others = evaluation.noveltyRecords.filter(
          (record) => record.conceptKey !== conceptKey,
        );
        const noveltyRecords: EvaluationNoveltyRecord[] =
          status === EvaluationValues.C
            ? others
            : [...others, { conceptKey, status: status as GroupedConceptStatus }];

        return { ...evaluation, noveltyRecords };
      }),
    }));
  };

  const save = () => {
    if (!form.manufacturingPlantId) {
      fail("manufacturingPlantId", "Selecciona la planta.");
      return;
    }

    if (!form.evaluations.length) {
      fail("evaluations", "Agrega al menos una evaluación: escanea el QR del extintor.");
      return;
    }

    const duplicatedEmergencyTeamIds = new Set<number>();
    const duplicatedExtinguisherNumbers = new Set<string>();
    const emergencyTeamIds = new Set<number>();
    const extinguisherNumbers = new Set<string>();

    form.evaluations.forEach((evaluation) => {
      if (evaluation.emergencyTeamId > 0) {
        if (emergencyTeamIds.has(evaluation.emergencyTeamId)) {
          duplicatedEmergencyTeamIds.add(evaluation.emergencyTeamId);
        }
        emergencyTeamIds.add(evaluation.emergencyTeamId);
      }

      const extinguisherNumber = evaluation.extinguisherNumber.trim();
      if (extinguisherNumbers.has(extinguisherNumber)) {
        duplicatedExtinguisherNumbers.add(extinguisherNumber);
      }
      extinguisherNumbers.add(extinguisherNumber);
    });

    if (duplicatedEmergencyTeamIds.size > 0 || duplicatedExtinguisherNumbers.size > 0) {
      toast.error("No se pueden guardar evaluaciones con IDs o números de extintor repetidos");
      return;
    }

    const dateErrors: Record<number, string[]> = {};
    form.evaluations.forEach((evaluation, index) => {
      for (const [field, label] of [
        ["nextRechargeDate", "Próxima recarga"],
        ["maintenanceDate", "Mantenimiento"],
      ] as const) {
        const value = evaluation[field];
        const date = dayjs(value);
        const message = !value
          ? `${label}: elige una fecha.`
          : !date.isValid() || date.format("YYYY-MM-DD") !== value
            ? `${label}: fecha no válida.`
            : date.isBefore(today, "day")
              ? `${label}: la fecha no puede ser anterior a hoy.`
              : null;
        // Sin ??=: React Compiler no lo soporta.
        if (message) dateErrors[index] = [...(dateErrors[index] ?? []), message];
      }
    });
    if (Object.keys(dateErrors).length) {
      setEvaluationErrors({ byIndex: dateErrors, evaluations: form.evaluations });
      document
        .getElementById(`evaluacion-${Object.keys(dateErrors)[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = {
      manufacturingPlantId: Number(form.manufacturingPlantId),
      evaluations: form.evaluations.map((evaluation) => {
        const conceptStatuses = groupedConceptFields.reduce(
          (acc, field) => {
            acc[field.key] = EvaluationValues.C;
            return acc;
          },
          {} as Record<GroupedConceptKey, EvaluationValues>,
        );

        evaluation.noveltyRecords.forEach((record) => {
          conceptStatuses[record.conceptKey] = record.status;
        });

        return {
          location: evaluation.location.trim(),
          extinguisherNumber: evaluation.extinguisherNumber.trim(),
          typeOfExtinguisher: evaluation.typeOfExtinguisher,
          capacity: Number(evaluation.capacity),
          pressureManometer: conceptStatuses.pressureManometer,
          valve: conceptStatuses.valve,
          hose: conceptStatuses.hose,
          cylinder: conceptStatuses.cylinder,
          barrette: conceptStatuses.barrette,
          seal: conceptStatuses.seal,
          cornet: conceptStatuses.cornet,
          access: conceptStatuses.access,
          support: conceptStatuses.support,
          signaling: conceptStatuses.signaling,
          nextRechargeDate: evaluation.nextRechargeDate,
          maintenanceDate: evaluation.maintenanceDate,
          observations: evaluation.observations.trim() || undefined,
        };
      }),
    };

    saveMutation.mutate(payload);
  };

  const evaluationsCount = form.evaluations.length;
  const nonCompliantCount = form.evaluations.reduce(
    (total, evaluation) =>
      total +
      evaluation.noveltyRecords.filter(({ status }) => status === EvaluationValues.NC).length,
    0,
  );

  // Inspección que se edita: esqueleto mientras llega (antes se veía el
  // formulario vacío) y aviso si no existe o no se pudo cargar.
  if (isEditRecordPending(record.status)) {
    return (
      <EditRecordState
        status={record.status}
        onRetry={record.retry}
        title="Agregar evaluaciones a la inspección"
        notFoundTitle="Inspección no encontrada"
        listHref="/extinguisher-inspection"
      />
    );
  }

  // Como el registro de Gemba Walk: datos de la inspección, extintores
  // escaneados (cada uno con su lista de verificación) y una barra fija con
  // el resumen y las acciones. Ancho máximo con el título alineado.
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <PageHeader
        title={
          idCurrent ? "Agregar evaluaciones a la inspección" : "Nueva inspección de extintores"
        }
      />
      <Stack spacing={3}>
        <DetailSection title="Inspección" description="Selecciona la planta de la inspección.">
          <Grid container spacing={2}>
            <SelectManufacturingPlantsOwn
              value={form.manufacturingPlantId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  manufacturingPlantId: e.target.value,
                  evaluations: [],
                }))
              }
              error={errorOf("manufacturingPlantId")}
            />
          </Grid>
        </DetailSection>

        <DetailSection
          title="Extintores evaluados"
          description="Escanea el QR de cada extintor, selecciona sus fechas de recarga y mantenimiento y marca lo que no cumple."
          action={
            evaluationsCount > 0 && (
              <StatusChip
                size="small"
                tone="success"
                variant="outlined"
                label={`${evaluationsCount} ${evaluationsCount === 1 ? "extintor" : "extintores"}`}
              />
            )
          }
        >
          {/* M1: agregar va arriba de las evaluaciones; Guardar y Cancelar,
              al pie, como en el resto de los formularios. */}
          {evaluationsCount === 0 ? (
            <Stack
              spacing={1.5}
              sx={(theme) => ({
                alignItems: "center",
                textAlign: "center",
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                border: "2px dashed",
                borderColor: errorOf("evaluations") ? "error.main" : "divider",
                backgroundColor: alpha(theme.palette.text.primary, 0.03),
              })}
            >
              <QrCodeScannerIcon aria-hidden sx={{ fontSize: 40, color: "text.secondary" }} />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Aún no hay evaluaciones. Escanea el QR impreso en el extintor para agregarlo.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<QrCodeScannerIcon />}
                onClick={openScanner}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Agregar evaluación
              </Button>
              {errorOf("evaluations") && (
                <FormHelperText data-error-for="evaluations" error>
                  {errorOf("evaluations")}
                </FormHelperText>
              )}
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<QrCodeScannerIcon />}
                onClick={openScanner}
                sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
              >
                Agregar evaluación
              </Button>
              {form.evaluations.map((evaluation, index) => (
                <EvaluationCard
                  key={`evaluation-${evaluation.emergencyTeamId}-${index}`}
                  evaluation={evaluation}
                  index={index}
                  errors={evaluationErrorsOf(index)}
                  removeEvaluation={removeEvaluation}
                  setConceptStatus={setConceptStatus}
                  updateObservations={updateObservations}
                  updateDate={updateDate}
                />
              ))}
            </Stack>
          )}
        </DetailSection>
      </Stack>

      {/* Al pie y siempre a la vista: resumen y acciones. */}
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
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            aria-live="polite"
            sx={{ flex: 1, alignItems: "center", flexWrap: "wrap" }}
          >
            <StatusChip
              size="small"
              tone={evaluationsCount ? "success" : "default"}
              label={`${evaluationsCount} ${evaluationsCount === 1 ? "extintor" : "extintores"}`}
            />
            <StatusChip
              size="small"
              tone={nonCompliantCount ? "error" : "default"}
              label={`${nonCompliantCount} ${nonCompliantCount === 1 ? "no cumple" : "no cumplen"}`}
            />
          </Stack>
          <FormActions
            onCancel={cancel}
            onSave={save}
            isSaving={isLoading}
            saveActionName={
              idCurrent ? "Guardar evaluaciones de extintores" : "Guardar inspección de extintores"
            }
            saveLabel={idCurrent ? "Guardar evaluaciones" : "Guardar inspección"}
            inline
          />
        </Paper>
      </Box>

      <Dialog open={isScannerOpen} onClose={closeScanner} fullWidth maxWidth="sm">
        <DialogTitle>Escanear QR de Equipo de Emergencia</DialogTitle>
        <DialogContent>
          {scannerError ? (
            <Alert severity="warning">{scannerError}</Alert>
          ) : (
            <Box sx={{ width: "100%", mt: 1 }}>
              <video
                ref={setVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: "100%", borderRadius: 8, background: "#000" }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Apunte la cámara al QR impreso del equipo de emergencia.
              </Typography>
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeScanner} startIcon={<CloseIcon />}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExtinguisherInspectionFormPage;
