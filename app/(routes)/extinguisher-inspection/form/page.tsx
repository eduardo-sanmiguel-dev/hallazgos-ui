"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import SaveIcon from "@mui/icons-material/Save";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
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
import {
  EmergencyTeamsService,
  ExtinguisherInspectionsService,
} from "@services";
import { EmergencyTeam, EvaluationValues, ExtinguisherType } from "@interfaces";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";

import {
  ExtinguisherInspection,
  ExtinguisherInspectionEvaluation,
} from "@interfaces";

type GroupedConceptKey =
  | "pressureManometer"
  | "valve"
  | "hose"
  | "cylinder"
  | "barrette"
  | "seal"
  | "cornet"
  | "access"
  | "support"
  | "signaling";

type GroupedConceptStatus = EvaluationValues.NC | EvaluationValues.NA;

interface EvaluationNoveltyRecord {
  conceptKey: GroupedConceptKey;
  status: GroupedConceptStatus;
}

interface LocalEvaluation {
  emergencyTeamId: number;
  location: string;
  extinguisherNumber: string;
  typeOfExtinguisher: ExtinguisherType;
  capacity: string;
  pressureManometer: EvaluationValues;
  valve: EvaluationValues;
  hose: EvaluationValues;
  cylinder: EvaluationValues;
  barrette: EvaluationValues;
  seal: EvaluationValues;
  cornet: EvaluationValues;
  access: EvaluationValues;
  support: EvaluationValues;
  signaling: EvaluationValues;
  noveltyRecords: EvaluationNoveltyRecord[];
  observations: string;
  newNoveltyConcept: GroupedConceptKey | "";
  newNoveltyStatus: GroupedConceptStatus | "";
}

const groupedConceptFields: Array<{ key: GroupedConceptKey; label: string }> = [
  { key: "pressureManometer", label: "Manómetro" },
  { key: "valve", label: "Válvula" },
  { key: "hose", label: "Manguera" },
  { key: "cylinder", label: "Cilindro" },
  { key: "barrette", label: "Pasador" },
  { key: "seal", label: "Sello" },
  { key: "cornet", label: "Corneta" },
  { key: "access", label: "Acceso" },
  { key: "support", label: "Soporte" },
  { key: "signaling", label: "Señalización" },
];

const groupedStatusValues: GroupedConceptStatus[] = [
  EvaluationValues.NC,
  EvaluationValues.NA,
];

const statusLegendMap: Record<EvaluationValues, string> = {
  [EvaluationValues.C]: "C: CUMPLE",
  [EvaluationValues.NC]: "NC: NO CUMPLE",
  [EvaluationValues.NA]: "NA: No Aplica",
};
const groupedConceptLabelMap = groupedConceptFields.reduce(
  (acc, field) => {
    acc[field.key] = field.label;
    return acc;
  },
  {} as Record<GroupedConceptKey, string>,
);

const DUPLICATE_EVALUATION_TOAST_ID = "duplicate-evaluation";

const getDefaultEvaluationFromEmergencyTeam = (
  emergencyTeam: EmergencyTeam,
): LocalEvaluation => ({
  emergencyTeamId: emergencyTeam.id,
  location: emergencyTeam.location,
  extinguisherNumber: emergencyTeam.extinguisherNumber.toString(),
  typeOfExtinguisher: emergencyTeam.typeOfExtinguisher,
  capacity: emergencyTeam.capacity.toString(),
  pressureManometer: EvaluationValues.C,
  valve: EvaluationValues.C,
  hose: EvaluationValues.C,
  cylinder: EvaluationValues.C,
  barrette: EvaluationValues.C,
  seal: EvaluationValues.C,
  cornet: EvaluationValues.C,
  access: EvaluationValues.C,
  support: EvaluationValues.C,
  signaling: EvaluationValues.C,
  noveltyRecords: [],
  observations: "",
  newNoveltyConcept: "",
  newNoveltyStatus: "",
});

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
  const lastScannedValueRef = useRef<string>("");
  const lastScannedAtRef = useRef<number>(0);
  const evaluationsRef = useRef<LocalEvaluation[]>([]);

  const router = useRouter();
  const searchParams = useSearchParams();

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
      newNoveltyConcept: "",
      newNoveltyStatus: "",
    };
  };

  const cancel = () => {
    router.push("/extinguisher-inspection");
  };

  const stopScanner = () => {
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;
      scanningRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scanFrame = async () => {
        if (!scanningRef.current || !videoRef.current) {
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
    } catch {
      setScannerError(
        "No se pudo acceder a la cámara. Verifique permisos del navegador.",
      );
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

  const updateNoveltyDraft = (
    index: number,
    key: "newNoveltyConcept" | "newNoveltyStatus" | "observations",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((evaluation, idx) => {
        if (idx !== index) {
          return evaluation;
        }

        return {
          ...evaluation,
          [key]: value,
        };
      }),
    }));
  };

  const addNoveltyRecord = (index: number) => {
    const evaluation = form.evaluations[index];
    if (!evaluation) {
      return;
    }

    if (!evaluation.newNoveltyConcept || !evaluation.newNoveltyStatus) {
      toast.error("Seleccione novedad y estado para agregar");
      return;
    }

    const noveltyRecord: EvaluationNoveltyRecord = {
      conceptKey: evaluation.newNoveltyConcept,
      status: evaluation.newNoveltyStatus,
    };

    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((item, idx) => {
        if (idx !== index) {
          return item;
        }

        const existingIndex = item.noveltyRecords.findIndex(
          (record) => record.conceptKey === noveltyRecord.conceptKey,
        );

        const nextRecords = [...item.noveltyRecords];
        if (existingIndex >= 0) {
          nextRecords[existingIndex] = noveltyRecord;
        } else {
          nextRecords.push(noveltyRecord);
        }

        return {
          ...item,
          noveltyRecords: nextRecords,
          newNoveltyConcept: "",
          newNoveltyStatus: "",
        };
      }),
    }));

    if (
      evaluation.noveltyRecords.some(
        (record) => record.conceptKey === noveltyRecord.conceptKey,
      )
    ) {
      toast.success("Novedad actualizada");
    } else {
      toast.success("Novedad agregada");
    }
  };

  const removeNoveltyRecord = (
    evaluationIndex: number,
    recordIndex: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      evaluations: prev.evaluations.map((evaluation, idx) => {
        if (idx !== evaluationIndex) {
          return evaluation;
        }

        return {
          ...evaluation,
          noveltyRecords: evaluation.noveltyRecords.filter(
            (_record, currentIndex) => currentIndex !== recordIndex,
          ),
        };
      }),
    }));
  };

  const save = () => {
    if (!form.manufacturingPlantId) {
      toast.error("La planta es requerida");
      return;
    }

    if (!form.sharedNextRechargeDate) {
      toast.error("La fecha de próxima recarga es requerida");
      return;
    }

    if (dayjs(form.sharedNextRechargeDate).isBefore(today, "day")) {
      toast.error("La fecha de próxima recarga no puede ser anterior a hoy");
      return;
    }

    if (!form.evaluations.length) {
      toast.error("Debe agregar al menos una evaluación");
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
          extinguisherNumber: Number(evaluation.extinguisherNumber),
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
      .finally(() => setIsLoading(false));
  };

  const isValidateForm = useMemo(
    () =>
      !form.manufacturingPlantId ||
      !form.sharedNextRechargeDate ||
      !form.evaluations.length,
    [form],
  );

  return (
    <>
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
        />

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 3,
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
                  },
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            fullWidth
            startIcon={<QrCodeScannerIcon />}
            onClick={openScanner}
            sx={{ mt: 1, minHeight: 40 }}
          >
            Crear evaluación
          </Button>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2,
          }}
        >
          <Button
            variant="contained"
            color="error"
            size="small"
            fullWidth
            startIcon={<CloseIcon />}
            onClick={cancel}
            sx={{ mt: 1, minHeight: 40 }}
          >
            Cancelar
          </Button>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 2,
          }}
        >
          <Button
            loading={isLoading}
            loadingPosition="start"
            startIcon={<SaveIcon />}
            variant="contained"
            color="primary"
            size="small"
            fullWidth
            onClick={save}
            disabled={isValidateForm || isLoading}
            sx={{ mt: 1, minHeight: 40 }}
          >
            Guardar
          </Button>
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 12,
            md: 12,
          }}
        >
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6">Evaluaciones</Typography>
        </Grid>

        {form.evaluations.map((evaluation, index) => (
          <Grid
            key={`evaluation-${evaluation.emergencyTeamId}-${index}`}
            size={{
              xs: 12,
              sm: 12,
              md: 12,
            }}
          >
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      borderColor: "primary.main",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Datos del equipo
                      </Typography>
                    </Box>

                    <Grid container spacing={1.5} sx={{ p: 1.5 }}>
                      {[
                        {
                          label: "Ubicación",
                          value: evaluation.location || "-",
                        },
                        {
                          label: "N. Extintor",
                          value: evaluation.extinguisherNumber || "-",
                        },
                        {
                          label: "Tipo",
                          value: evaluation.typeOfExtinguisher || "-",
                        },
                        {
                          label: "Capacidad",
                          value: evaluation.capacity || "-",
                        },
                      ].map((item) => (
                        <Grid key={item.label} size={{ xs: 12, sm: 6, md: 12 }}>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 1,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "primary.main",
                              backgroundColor: alpha("#1976d2", 0.08),
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: "primary.main",
                              }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 12, md: 8 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 8, md: 8 }}>
                      <Paper>
                        <TextField
                          select
                          label="Novedad"
                          fullWidth
                          value={evaluation.newNoveltyConcept}
                          onChange={(e) =>
                            updateNoveltyDraft(
                              index,
                              "newNoveltyConcept",
                              e.target.value,
                            )
                          }
                        >
                          <MenuItem value="">Seleccione</MenuItem>
                          {groupedConceptFields.map((field) => (
                            <MenuItem key={field.key} value={field.key}>
                              {field.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                      <Paper>
                        <TextField
                          select
                          label="Estado"
                          fullWidth
                          value={evaluation.newNoveltyStatus}
                          onChange={(e) =>
                            updateNoveltyDraft(
                              index,
                              "newNoveltyStatus",
                              e.target.value,
                            )
                          }
                        >
                          <MenuItem value="">Seleccione</MenuItem>
                          {groupedStatusValues.map((status) => (
                            <MenuItem key={status} value={status}>
                              {statusLegendMap[status]}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => addNoveltyRecord(index)}
                      >
                        Agregar
                      </Button>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                      <Paper>
                        <TextField
                          label="Observaciones generales"
                          fullWidth
                          multiline
                          minRows={6}
                          autoComplete="off"
                          value={evaluation.observations}
                          onChange={(e) =>
                            updateNoveltyDraft(
                              index,
                              "observations",
                              e.target.value,
                            )
                          }
                        />
                      </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        Los conceptos no agregados en la tabla se enviarán como
                        C: CUMPLE.
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {!!evaluation.noveltyRecords.length && (
                  <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <StyledTableRow>
                            <StyledTableCell>Novedad</StyledTableCell>
                            <StyledTableCell>Estado</StyledTableCell>
                            <StyledTableCell>Acción</StyledTableCell>
                          </StyledTableRow>
                        </TableHead>
                        <TableBody>
                          {evaluation.noveltyRecords.map(
                            (record, recordIndex) => (
                              <StyledTableRow
                                key={`${record.conceptKey}-${recordIndex}`}
                              >
                                <StyledTableCell>
                                  {groupedConceptLabelMap[record.conceptKey]}
                                </StyledTableCell>
                                <StyledTableCell>
                                  {statusLegendMap[record.status]}
                                </StyledTableCell>
                                <StyledTableCell>
                                  <IconButton
                                    color="error"
                                    size="small"
                                    aria-label="Quitar novedad"
                                    onClick={() =>
                                      removeNoveltyRecord(index, recordIndex)
                                    }
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </StyledTableCell>
                              </StyledTableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeEvaluation(index)}
                  >
                    Eliminar evaluación
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>

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
                ref={videoRef}
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
    </>
  );
};

export default ExtinguisherInspectionFormPage;

