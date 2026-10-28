"use client";

import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import { alpha } from "@mui/material/styles";
import { primaryTextColor } from "../../../../theme";
import {
  StyledTableCell,
  StyledTableRow,
} from "@shared/components/TableDefault";
import {
  LocalEvaluation,
  OBSERVATIONS_MAX_LENGTH,
  groupedConceptFields,
  groupedConceptLabelMap,
  groupedStatusValues,
  statusLegendMap,
} from "../_lib/evaluation";

interface EvaluationCardProps {
  evaluation: LocalEvaluation;
  index: number;
  // Errores del API de esta evaluación ("Capacidad: debe ser 1 o mayor.").
  errors?: string[];
  removeEvaluation: (index: number) => void;
  updateNoveltyDraft: (
    index: number,
    key: "newNoveltyConcept" | "newNoveltyStatus" | "observations",
    value: string,
  ) => void;
  addNoveltyRecord: (index: number) => void;
  removeNoveltyRecord: (evaluationIndex: number, recordIndex: number) => void;
}

/** Tarjeta de una evaluación del formulario; el estado vive en la página. */
export const EvaluationCard = ({
  evaluation,
  index,
  errors,
  removeEvaluation,
  updateNoveltyDraft,
  addNoveltyRecord,
  removeNoveltyRecord,
}: EvaluationCardProps) => (
  <Grid
    size={{
      xs: 12,
      sm: 12,
      md: 12,
    }}
  >
    <Paper
      id={`evaluacion-${index}`}
      component="section"
      aria-label={`Evaluación del extintor ${evaluation.extinguisherNumber}`}
      variant="outlined"
      sx={{ p: 2, ...(errors?.length && { borderColor: "error.main" }) }}
    >
      <Grid container spacing={2}>
        {!!errors?.length && (
          <Grid size={12}>
            <Alert severity="error">
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
          </Grid>
        )}
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
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: primaryTextColor,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
              <TextField
                select
                label="Novedad"
                fullWidth
                value={evaluation.newNoveltyConcept}
                onChange={(e) =>
                  updateNoveltyDraft(index, "newNoveltyConcept", e.target.value)
                }
              >
                <MenuItem value="">Seleccione</MenuItem>
                {groupedConceptFields.map((field) => (
                  <MenuItem key={field.key} value={field.key}>
                    {field.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <TextField
                select
                label="Estado"
                fullWidth
                value={evaluation.newNoveltyStatus}
                onChange={(e) =>
                  updateNoveltyDraft(index, "newNoveltyStatus", e.target.value)
                }
              >
                <MenuItem value="">Seleccione</MenuItem>
                {groupedStatusValues.map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusLegendMap[status]}
                  </MenuItem>
                ))}
              </TextField>
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
              <TextField
                label="Observaciones generales"
                fullWidth
                multiline
                minRows={3}
                autoComplete="off"
                // El API acepta hasta 500 caracteres: se limita aquí y se
                // muestra cuánto queda.
                slotProps={{
                  htmlInput: { maxLength: OBSERVATIONS_MAX_LENGTH },
                }}
                helperText={`${evaluation.observations.length} / ${OBSERVATIONS_MAX_LENGTH}`}
                value={evaluation.observations}
                onChange={(e) =>
                  updateNoveltyDraft(index, "observations", e.target.value)
                }
              />
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
                  {evaluation.noveltyRecords.map((record, recordIndex) => (
                    <StyledTableRow key={`${record.conceptKey}-${recordIndex}`}>
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Button
            variant="outlined"
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
);
