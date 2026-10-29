"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import { alpha } from "@mui/material/styles";

import { EvaluationValues } from "@interfaces";
import StatusChip from "@shared/components/StatusChip";
import {
  GroupedConceptKey,
  LocalEvaluation,
  OBSERVATIONS_MAX_LENGTH,
  groupedConceptFields,
} from "../_lib/evaluation";

interface EvaluationCardProps {
  evaluation: LocalEvaluation;
  index: number;
  // Errores del API de esta evaluación ("Capacidad: debe ser 1 o mayor.").
  errors?: string[];
  removeEvaluation: (index: number) => void;
  setConceptStatus: (
    index: number,
    conceptKey: GroupedConceptKey,
    status: EvaluationValues,
  ) => void;
  updateObservations: (index: number, value: string) => void;
}

const STATUS_OPTIONS = [
  { value: EvaluationValues.C, label: "Cumple", color: "success" },
  { value: EvaluationValues.NC, label: "No cumple", color: "error" },
  { value: EvaluationValues.NA, label: "No aplica", color: "standard" },
] as const;

/**
 * Tarjeta de un extintor de la inspección: datos del equipo (del QR) y los
 * 10 conceptos como lista de verificación (C / NC / NA, todos en C al
 * escanear). Antes, cada novedad pedía elegir concepto y estado en dos
 * listas y tocar "Agregar". El estado vive en la página.
 */
export const EvaluationCard = ({
  evaluation,
  index,
  errors,
  removeEvaluation,
  setConceptStatus,
  updateObservations,
}: EvaluationCardProps) => {
  const statusOf = (key: GroupedConceptKey) =>
    evaluation.noveltyRecords.find(({ conceptKey }) => conceptKey === key)
      ?.status ?? EvaluationValues.C;

  const nonCompliant = evaluation.noveltyRecords.filter(
    ({ status }) => status === EvaluationValues.NC,
  ).length;
  const notApplicable = evaluation.noveltyRecords.length - nonCompliant;

  return (
    <Paper
      id={`evaluacion-${index}`}
      component="section"
      aria-label={`Evaluación del extintor ${evaluation.extinguisherNumber}`}
      variant="outlined"
      sx={(theme) => ({
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        borderColor: errors?.length ? "error.main" : "divider",
        // Franja izquierda: rojo si algo no cumple; verde si no.
        borderLeft: `6px solid ${
          nonCompliant ? theme.palette.error.main : theme.palette.success.main
        }`,
      })}
    >
      {!!errors?.length && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.length === 1 ? (
            errors[0]
          ) : (
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* Datos del equipo (vienen del QR, no se escriben). */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box
          aria-hidden
          sx={(theme) => ({
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            flexShrink: 0,
            color: "error.main",
            backgroundColor: alpha(theme.palette.error.main, 0.1),
          })}
        >
          <FireExtinguisherIcon />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            component="h3"
            sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
          >
            Extintor {evaluation.extinguisherNumber || "-"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {evaluation.location || "-"}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ mt: 1, flexWrap: "wrap" }}
          >
            <StatusChip
              size="small"
              variant="outlined"
              label={`Tipo: ${evaluation.typeOfExtinguisher || "-"}`}
            />
            <StatusChip
              size="small"
              variant="outlined"
              label={`Capacidad: ${evaluation.capacity || "-"}`}
            />
            <StatusChip
              size="small"
              tone={nonCompliant ? "error" : "success"}
              label={
                nonCompliant
                  ? `${nonCompliant} no ${nonCompliant === 1 ? "cumple" : "cumplen"}`
                  : "Sin novedades"
              }
            />
            {notApplicable > 0 && (
              <StatusChip
                size="small"
                label={`${notApplicable} no ${notApplicable === 1 ? "aplica" : "aplican"}`}
              />
            )}
          </Stack>
        </Box>
        <Tooltip title="Eliminar evaluación">
          <IconButton
            color="error"
            aria-label="Eliminar evaluación"
            onClick={() => removeEvaluation(index)}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Conceptos: lista de verificación. */}
      <Typography
        variant="subtitle2"
        component="h4"
        sx={{ mt: 2.5, mb: 0.5, fontWeight: 700 }}
      >
        Conceptos
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Todos inician en <strong>Cumple</strong>; marca solo lo que no cumple o
        no aplica.
      </Typography>
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        {groupedConceptFields.map(({ key, label }) => {
          const status = statusOf(key);

          return (
            <Box
              key={key}
              sx={(theme) => ({
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                // Lo que no cumple resalta al recorrer la lista.
                backgroundColor:
                  status === EvaluationValues.NC
                    ? alpha(theme.palette.error.main, 0.06)
                    : status === EvaluationValues.NA
                      ? theme.palette.action.hover
                      : "transparent",
              })}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={status}
                onChange={(_, value: EvaluationValues | null) => {
                  if (value) setConceptStatus(index, key, value);
                }}
                aria-label={label}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  backgroundColor: "background.paper",
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    value={option.value}
                    color={option.color}
                    sx={(theme) => {
                      const tone =
                        option.color === "standard"
                          ? theme.palette.text.primary
                          : theme.palette[option.color].main;

                      return {
                        flex: 1,
                        px: 1.25,
                        whiteSpace: "nowrap",
                        // Sin elegir, discreto (en oscuro MUI lo deja blanco
                        // y parecía el elegido).
                        color: "text.secondary",
                        fontWeight: 500,
                        "&.Mui-selected, &.Mui-selected:hover": {
                          fontWeight: 700,
                          backgroundColor: alpha(
                            tone,
                            theme.palette.mode === "dark" ? 0.24 : 0.14,
                          ),
                        },
                        // "No cumple" en sólido: salta a la vista. En oscuro,
                        // el rojo más fuerte para que el blanco cumpla AA.
                        ...(option.value === EvaluationValues.NC && {
                          "&.Mui-selected, &.Mui-selected:hover": {
                            fontWeight: 700,
                            color: theme.palette.error.contrastText,
                            backgroundColor:
                              theme.palette.mode === "dark"
                                ? theme.palette.error.dark
                                : theme.palette.error.main,
                          },
                        }),
                      };
                    }}
                  >
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          );
        })}
      </Box>

      <TextField
        label="Observaciones generales"
        fullWidth
        multiline
        minRows={2}
        autoComplete="off"
        // El API acepta hasta 500 caracteres: se limita aquí y se muestra
        // cuánto queda.
        slotProps={{
          htmlInput: { maxLength: OBSERVATIONS_MAX_LENGTH },
        }}
        helperText={`${evaluation.observations.length} / ${OBSERVATIONS_MAX_LENGTH}`}
        value={evaluation.observations}
        onChange={(e) => updateObservations(index, e.target.value)}
        sx={{ mt: 2.5 }}
      />
    </Paper>
  );
};
