import { useEffect, useState } from "react";

import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { Grid } from "@mui/material";
import { Divider } from "@mui/material";
import { Stack } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";

import {
  durantionToTime,
  stringToDateWithTime,
  updatedDateLabel,
} from "@shared/utils";
import {
  getDeadline,
  getPriorityLabel,
  getPriorityRiskLevel,
} from "@routes/hallazgos/_constants/priorityOptions";
import StatusChip, { EvidenceStatusChip } from "@shared/components/StatusChip";
import { riskLevelTone } from "@shared/constants/semanticTones";
import EvidenceDeadline from "./EvidenceDeadline";
import TabsImageAndLogs from "./TabsImageAndLogs";
import { EvidenceGraphql } from "@hooks";
import { requiresPhotoEvidence } from "@routes/hallazgos/_constants/mainTypes";

interface Props {
  evidenceCurrent: EvidenceGraphql;
  setRefreshData: (refreshData: boolean) => void;
}

export default function DetailsTabs({
  evidenceCurrent,
  setRefreshData,
}: Props) {
  const theme = useTheme();

  const [withImages, setWithImages] = useState<boolean>(false);
  const [isUnsafeBehavior, setIsUnsafeBehavior] = useState<boolean>(false);

  useEffect(() => {
    setWithImages(
      !!evidenceCurrent.imgEvidence ||
        !!evidenceCurrent.imgProcess ||
        !!evidenceCurrent.imgSolution,
    );
  }, [evidenceCurrent]);

  useEffect(() => {
    if (!evidenceCurrent) return;
    setIsUnsafeBehavior(!requiresPhotoEvidence(evidenceCurrent.mainType));
  }, [evidenceCurrent]);

  const priorityLabel = getPriorityLabel(evidenceCurrent.priorityDays);
  const riskLevel = getPriorityRiskLevel(evidenceCurrent.priorityDays);
  // Mismo plazo y tonos que la tabla y las tarjetas.
  const deadline = getDeadline(evidenceCurrent);

  const responsiblesLabel =
    evidenceCurrent.responsibles.length > 0
      ? evidenceCurrent.responsibles
          .map((responsible) => responsible.name)
          .join(" / ")
      : evidenceCurrent.supervisors
          .map((supervisor) => supervisor.name)
          .join(" / ");

  const sectionTitleSx = {
    fontWeight: 700,
    color: "text.secondary",
    letterSpacing: 0.4,
  };

  const rowLabelSx = {
    color: "text.secondary",
    fontSize: 12,
    letterSpacing: 0.2,
  };

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      <Grid
        size={{
          xs: 12,
          sm: 4,
          md: 4,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            borderColor: theme.palette.divider,
          }}
        >
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Detalle del hallazgo
              </Typography>
              <EvidenceStatusChip
                status={evidenceCurrent.status}
                size="small"
              />
              {!withImages && (
                <StatusChip
                  label="Sin evidencia fotográfica"
                  tone="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>

            <Divider />

            <Typography variant="caption" sx={sectionTitleSx}>
              CLASIFICACIÓN
            </Typography>
            <Box>
              <Typography sx={rowLabelSx}>Planta</Typography>
              <Typography variant="body2">
                {evidenceCurrent.manufacturingPlant.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Hallazgo</Typography>
              <Typography variant="body2">
                {evidenceCurrent.mainType.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Tipo de hallazgo</Typography>
              <Typography variant="body2">
                {evidenceCurrent.secondaryType.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Zona</Typography>
              <Typography variant="body2">
                {evidenceCurrent.zone.area?.name || "Sin zona"}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Lugar</Typography>
              <Typography variant="body2">
                {evidenceCurrent.zone.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Proceso</Typography>
              <Typography variant="body2">
                {evidenceCurrent.process?.name || "-"}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="caption" sx={sectionTitleSx}>
              ASIGNACIÓN
            </Typography>
            <Box>
              <Typography sx={rowLabelSx}>Usuario que reporta</Typography>
              <Typography variant="body2">
                {evidenceCurrent.user.name}
              </Typography>
            </Box>
            <Box>
              <Typography sx={rowLabelSx}>Responsables asignados</Typography>
              <Typography variant="body2">
                {responsiblesLabel || "-"}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="caption" sx={sectionTitleSx}>
              PRIORIDAD Y TIEMPOS
            </Typography>
            {priorityLabel !== "Sin prioridad" && (
              <Box>
                <Typography sx={rowLabelSx}>Prioridad</Typography>
                {/* Con el tono de su nivel de riesgo, como en el dashboard. */}
                <StatusChip
                  label={priorityLabel}
                  tone={riskLevel ? riskLevelTone(riskLevel) : "default"}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
            {deadline && (
              <Box>
                <Typography sx={rowLabelSx}>
                  {deadline.state === "resolved" ? "Resolución" : "Plazo"}
                </Typography>
                <EvidenceDeadline deadline={deadline} />
              </Box>
            )}
            <Box>
              <Typography sx={rowLabelSx}>Fecha de registro</Typography>
              <Typography variant="body2">
                {stringToDateWithTime(evidenceCurrent.createdAt)}
              </Typography>
            </Box>
            {evidenceCurrent.startProcessDate && (
              <Box>
                <Typography sx={rowLabelSx}>
                  Fecha de inicio de proceso
                </Typography>
                <Typography variant="body2">
                  {stringToDateWithTime(evidenceCurrent.startProcessDate)}
                </Typography>
              </Box>
            )}
            {evidenceCurrent.solutionDate && (
              <Box>
                <Typography sx={rowLabelSx}>Fecha de cierre</Typography>
                <Typography variant="body2">
                  {stringToDateWithTime(evidenceCurrent.solutionDate)} (
                  {durantionToTime(evidenceCurrent)})
                </Typography>
              </Box>
            )}
            {/* Solo si se editó: igual a la de registro no aporta nada. */}
            {updatedDateLabel(
              evidenceCurrent.createdAt,
              evidenceCurrent.updatedAt,
            ) && (
              <Box>
                <Typography sx={rowLabelSx}>Última actualización</Typography>
                <Typography variant="body2">
                  {updatedDateLabel(
                    evidenceCurrent.createdAt,
                    evidenceCurrent.updatedAt,
                  )}
                </Typography>
              </Box>
            )}

            <Divider />

            <Typography variant="caption" sx={sectionTitleSx}>
              DESCRIPCIÓN
            </Typography>
            <Box>
              <Typography sx={rowLabelSx}>Lo que se observó</Typography>
              <Typography variant="body2">
                {evidenceCurrent.description || "-"}
              </Typography>
            </Box>

            {isUnsafeBehavior && evidenceCurrent.descriptionSolution && (
              <Box>
                <Typography sx={rowLabelSx}>Cómo se resolvió</Typography>
                <Typography variant="body2">
                  {evidenceCurrent.descriptionSolution}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Grid>
      <Grid
        size={{
          xs: 12,
          sm: 8,
          md: 8,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            borderRadius: 2,
            borderColor: theme.palette.divider,
            minHeight: "100%",
          }}
        >
          <TabsImageAndLogs
            evidenceCurrent={evidenceCurrent}
            setRefreshData={setRefreshData}
            withImages={withImages}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
