"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import { toast } from "sonner";
import jsQR from "jsqr";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

import SelectManufacturingPlantsOwn from "@components/SelectManufacturingPlantsOwn";
import PageHeader from "@shared/components/PageHeader";
import DetailSection from "@shared/components/DetailSection";
import StatusChip from "@shared/components/StatusChip";
import FormActions from "@shared/components/FormActions";
import { useFieldErrors } from "@hooks/useFieldErrors";
import {
  EmergencyTeamsService,
  ExtinguisherInspectionsService,
  parseApiError,
} from "@services";
import { EvaluationValues } from "@interfaces";

import {
  ExtinguisherInspection,
  ExtinguisherInspectionEvaluation,
} from "@interfaces";
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

const ExtinguisherInspectionFormPage = () => {
  const today = dayjs().startOf("day");
  const defaultNextRechargeDate = dayjs().add(1, "year").format("YYYY-MM-DD");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idCurrent, setIdCurrent] = useState<number>(0);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string>("");

  const [form, setForm] = useState({
    manufacturingPlantId: "",
    sharedNextRechargeDate: defaultNextRechargeDate,
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
  const { fail, failFromApi, errorOf } = useFieldErrors<
    "manufacturingPlantId" | "sharedNextRechargeDate" | "evaluations"
  >(form.manufacturingPlantId, form.sharedNextRechargeDate, form.evaluations);
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

  const mapEvaluationToLocal = (
    evaluation: ExtinguisherInspectionEvaluation,
  ): LocalEvaluation => {
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
      observations: evaluation.observations || "",
    };
  };

  const cancel = () => {
    router.push("/extinguisher-inspection");
  };

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

  const handleDetectedQr = async (rawValue: string) => {
    const emergencyTeamId = parseQrToEmergencyTeamId(rawValue);

    if (!emergencyTeamId) {
      toast.error("El QR no contiene un ID válido");
      return;
    }

    try {
      const emergencyTeam =
        await EmergencyTeamsService.findOne(emergencyTeamId);

      if (!form.manufacturingPlantId) {
        toast.error("Seleccione una planta antes de crear una evaluación");
        return;
      }

      if (
        Number(form.manufacturingPlantId) !==
        emergencyTeam.manufacturingPlant?.id
      ) {
        toast.error(
          "El equipo escaneado pertenece a una planta diferente a la seleccionada",
        );
        return;
      }

      const emergencyTeamExtinguisherNumber = String(
        emergencyTeam.extinguisherNumber,
      );

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
        evaluations: [
          getDefaultEvaluationFromEmergencyTeam(emergencyTeam),
          ...prev.evaluations,
        ],
      }));

      setIsScannerOpen(false);
      stopScanner();
      toast.success(`Equipo #${emergencyTeam.id} agregado a la inspección`);
    } catch {
      toast.error("No se pudo obtener el equipo de emergencia desde el QR");
    }
  };

  const startScanner = async () => {
    setScannerError("");
    lastScannedValueRef.current = "";
    lastScannedAtRef.current = 0;

    const session = scanSessionRef.current;

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerError(
          "El navegador no permite usar la cámara en este sitio. Use HTTPS o localhost.",
        );
        return;
      }

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

        try {
          const rawValue = detectWithJsQr();

          if (rawValue) {
            const normalizedValue = rawValue.trim();
            const now = Date.now();
            const isRepeatedScan =
              normalizedValue === lastScannedValueRef.current &&
              now - lastScannedAtRef.current < 2000;

            if (isRepeatedScan) {
              requestAnimationFrame(scanFrame);
              return;
            }

            lastScannedValueRef.current = normalizedValue;
            lastScannedAtRef.current = now;
            await handleDetectedQr(rawValue);
            return;
          }
        } catch {
          // Ignore one-frame detector errors and continue scanning.
        }

        requestAnimationFrame(scanFrame);
      };

      requestAnimationFrame(scanFrame);
    } catch (error) {
      if (session !== scanSessionRef.current) {
        return;
      }

      const name = error instanceof DOMException ? error.name : "";

      if (name === "NotAllowedError") {
        setScannerError(
          "Permiso de cámara denegado. Habilítelo en la configuración del navegador.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setScannerError("No se encontró ninguna cámara conectada.");
      } else if (name === "NotReadableError") {
        setScannerError(
          "La cámara está en uso por otra aplicación. Ciérrela e intente de nuevo.",
        );
      } else {
        setScannerError(
          "No se pudo acceder a la cámara. Verifique permisos del navegador.",
        );
      }
    }
  };

  const openScanner = () => {
    if (!form.manufacturingPlantId) {
      toast.error("Seleccione una planta antes de crear evaluación");
      return;
    }

    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
    stopScanner();
  };

  useEffect(() => {
    evaluationsRef.current = form.evaluations;
  }, [form.evaluations]);

  useEffect(() => {
    if (!isScannerOpen) {
      stopScanner();
      return;
    }

    void startScanner();

    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScannerOpen]);

  useEffect(() => {
    const id = Number(searchParams.get("id") || 0);
    if (!id) {
      return;
    }

    setIdCurrent(id);
    setIsLoading(true);

    ExtinguisherInspectionsService.findOne(id)
      .then((inspection: ExtinguisherInspection) => {
        const firstEvaluation = inspection.evaluations?.[0];

        setForm({
          manufacturingPlantId: String(inspection.manufacturingPlant?.id || ""),
          sharedNextRechargeDate: firstEvaluation?.nextRechargeDate
            ? dayjs(firstEvaluation.nextRechargeDate).format("YYYY-MM-DD")
            : defaultNextRechargeDate,
          evaluations: (inspection.evaluations || []).map(mapEvaluationToLocal),
        });
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const removeEvaluation = (index: number) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.filter((_, idx) => idx !== index),
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
            : [
                ...others,
                { conceptKey, status: status as GroupedConceptStatus },
              ];

        return { ...evaluation, noveltyRecords };
      }),
    }));
  };

  const save = () => {
    if (!form.manufacturingPlantId) {
      fail("manufacturingPlantId", "Selecciona la planta.");
      return;
    }

    if (!form.sharedNextRechargeDate) {
      fail("sharedNextRechargeDate", "Elige la fecha de próxima recarga.");
      return;
    }

    if (dayjs(form.sharedNextRechargeDate).isBefore(today, "day")) {
      fail(
        "sharedNextRechargeDate",
        "La fecha de próxima recarga no puede ser anterior a hoy.",
      );
      return;
    }

    if (!form.evaluations.length) {
      fail(
        "evaluations",
        "Agrega al menos una evaluación: escanea el QR del extintor.",
      );
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

    if (
      duplicatedEmergencyTeamIds.size > 0 ||
      duplicatedExtinguisherNumbers.size > 0
    ) {
      toast.error(
        "No se pueden guardar evaluaciones con IDs o números de extintor repetidos",
      );
      return;
    }

    setIsLoading(true);

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
          nextRechargeDate: form.sharedNextRechargeDate,
          maintenanceDate: form.sharedNextRechargeDate,
          observations: evaluation.observations.trim() || undefined,
        };
      }),
    };

    const request = idCurrent
      ? ExtinguisherInspectionsService.update(idCurrent, payload)
      : ExtinguisherInspectionsService.create(payload);

    request
      .then(() => {
        toast.success(
          idCurrent
            ? "Evaluaciones agregadas correctamente"
            : "Inspección creada correctamente",
        );
        cancel();
      })
      // El aviso lo muestra el interceptor; aquí se marca dónde corregir.
      .catch((error) => {
        failFromApi(error, inspectionApiField);
        const byIndex = evaluationApiErrors(parseApiError(error).fieldErrors);
        setEvaluationErrors({ byIndex, evaluations: form.evaluations });
        const first = Object.keys(byIndex)[0];
        if (first !== undefined) {
          document
            .getElementById(`evaluacion-${first}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      })
      .finally(() => setIsLoading(false));
  };

  const evaluationsCount = form.evaluations.length;
  const nonCompliantCount = form.evaluations.reduce(
    (total, evaluation) =>
      total +
      evaluation.noveltyRecords.filter(
        ({ status }) => status === EvaluationValues.NC,
      ).length,
    0,
  );

  // Como el registro de Gemba Walk: datos de la inspección, extintores
  // escaneados (cada uno con su lista de verificación) y una barra fija con
  // el resumen y las acciones. Ancho máximo con el título alineado.
  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      <PageHeader
        title={
          idCurrent
            ? "Agregar evaluaciones a la inspección"
            : "Nueva inspección de extintores"
        }
      />
      <Stack spacing={3}>
        <DetailSection
          title="Inspección"
          description="Planta y fecha de próxima recarga de todos los extintores."
        >
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

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="es"
                localeText={
                  esES.components.MuiLocalizationProvider.defaultProps
                    .localeText
                }
              >
                <DatePicker
                  label="Próxima recarga"
                  format="DD/MM/YYYY"
                  disablePast
                  minDate={today}
                  value={
                    form.sharedNextRechargeDate
                      ? dayjs(form.sharedNextRechargeDate)
                      : null
                  }
                  onChange={(newValue: Dayjs | null) =>
                    setForm((prev) => ({
                      ...prev,
                      sharedNextRechargeDate: newValue
                        ? newValue.format("YYYY-MM-DD")
                        : "",
                    }))
                  }
                  slotProps={{
                    field: {
                      clearable: true,
                      onClear: () =>
                        setForm((prev) => ({
                          ...prev,
                          sharedNextRechargeDate: "",
                        })),
                    },
                    textField: {
                      fullWidth: true,
                      id: "campo-sharedNextRechargeDate",
                      error: !!errorOf("sharedNextRechargeDate"),
                      helperText:
                        errorOf("sharedNextRechargeDate") ??
                        "Aplica a todas las evaluaciones.",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DetailSection>

        <DetailSection
          title="Extintores evaluados"
          description="Escanea el QR de cada extintor y marca lo que no cumple."
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
              <QrCodeScannerIcon
                aria-hidden
                sx={{ fontSize: 40, color: "text.secondary" }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Aún no hay evaluaciones. Escanea el QR impreso en el extintor
                para agregarlo.
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
            saveLabel={idCurrent ? "Guardar evaluaciones" : "Guardar"}
            inline
          />
        </Paper>
      </Box>

      <Dialog
        open={isScannerOpen}
        onClose={closeScanner}
        fullWidth
        maxWidth="sm"
      >
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
