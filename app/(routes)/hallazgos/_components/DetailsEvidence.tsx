import { useEffect, useMemo, useState } from "react";

import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { Grid } from "@mui/material";
import { Divider } from "@mui/material";
import { Stack } from "@mui/material";
import { Paper } from "@mui/material";
import { Chip } from "@mui/material";
import { Box } from "@mui/material";

import { durantionToTime, stringToDateWithTime } from "@shared/utils";
import {
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";
/* import {
  getPriorityLabel,
  getRemainingDays,
} from "@routes/hallazgos/_constants/priorityOptions"; */
import TabsImageAndLogs from "./TabsImageAndLogs";
import { EvidenceGraphql } from "@hooks";

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
    const { name } = evidenceCurrent.mainType;
    setIsUnsafeBehavior(
      name.toLocaleLowerCase().includes("comportamiento inseguro"),
    );
  }, [evidenceCurrent]);

  const statusColor = useMemo(() => {
    if (evidenceCurrent.status === STATUS_OPEN) return "warning" as const;
    if (evidenceCurrent.status === STATUS_CLOSED) return "success" as const;
    if (evidenceCurrent.status === STATUS_IN_PROGRESS) return "info" as const;
    return "error" as const;
  }, [evidenceCurrent.status]);

  /* const priorityLabel = getPriorityLabel(evidenceCurrent.priorityDays);
  const remainingDays = getRemainingDays(
    evidenceCurrent.createdAt,
    evidenceCurrent.priorityDays,
  ); */

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
              <Chip
                label={evidenceCurrent.status}
                color={statusColor}
                size="small"
              />
              {!withImages && (
                <Chip
                  label="Sin evidencia fotográfica"
                  color="warning"
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
              {/* PRIORIDAD Y TIEMPOS */}
              TIEMPOS
            </Typography>
            {/* {priorityLabel !== "Sin prioridad" && (
              <Box>
                <Typography sx={rowLabelSx}>Prioridad</Typography>
                <Typography variant="body2">{priorityLabel}</Typography>
              </Box>
            )}
            {evidenceCurrent.status !== STATUS_CLOSED &&
              remainingDays !== "N/A" && (
                <Box>
                  <Typography sx={rowLabelSx}>
                    Tiempo restante (días)
                  </Typography>
                  <Typography variant="body2">{remainingDays}</Typography>
                </Box>
              )} */}
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
            <Box>
              <Typography sx={rowLabelSx}>Última actualización</Typography>
              <Typography variant="body2">
                {stringToDateWithTime(evidenceCurrent.updatedAt)}
              </Typography>
            </Box>

            <Divider />

            <Typography variant="caption" sx={sectionTitleSx}>
              DESCRIPCIÓN
            </Typography>
            <Box>
              <Typography sx={rowLabelSx}>
                Descripción del comportamiento inseguro
              </Typography>
              <Typography variant="body2">
                {evidenceCurrent.description || "-"}
              </Typography>
            </Box>

            {isUnsafeBehavior && evidenceCurrent.descriptionSolution && (
              <Box>
                <Typography sx={rowLabelSx}>
                  Descripción de la solución del comportamiento inseguro
                </Typography>
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
