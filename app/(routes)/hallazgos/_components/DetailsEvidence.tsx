import { ReactNode, useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { Box } from "@mui/material";
import { ButtonBase } from "@mui/material";
import { Stack } from "@mui/material";
import { Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import {
  baseUrlImage,
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
import {
  evidenceStatusColor,
  STATUS_CANCELLED,
} from "@shared/constants/semanticTones";
import type { Theme } from "@mui/material/styles";
import { STATUS_CLOSED, STATUS_IN_PROGRESS } from "@shared/constants";
import type { EvidenceRow, EvidenceRowComment } from "@interfaces";
import { requiresPhotoEvidence } from "@routes/hallazgos/_constants/mainTypes";
import DetailSection, {
  DetailField,
  DetailFieldList,
} from "@shared/components/DetailSection";
import EvidenceDeadline from "./EvidenceDeadline";
import EvidenceComments from "./EvidenceComments";
import EvidencePhotoViewer, { EvidencePhoto } from "./EvidencePhotoViewer";

interface Props {
  evidenceCurrent: EvidenceRow;
  setRefreshData: (refreshData: boolean) => void;
}

/** Miniatura de una foto; al tocarla se abre el visor. */
function PhotoThumb({
  photo,
  onOpen,
}: {
  photo: EvidencePhoto;
  onOpen: () => void;
}) {
  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={`Ver ${photo.title.toLowerCase()} en grande`}
      sx={{
        position: "relative",
        display: "block",
        width: "100%",
        maxWidth: 320,
        aspectRatio: "4 / 3",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "action.hover",
        "& .zoom-hint": { opacity: { xs: 1, md: 0 } },
        "&:hover .zoom-hint, &.Mui-focusVisible .zoom-hint": { opacity: 1 },
      }}
    >
      <Image
        unoptimized
        src={photo.src}
        alt={photo.title}
        fill
        sizes="(max-width: 600px) 100vw, 320px"
        // Completa (sin recortar): es evidencia.
        style={{ objectFit: "contain" }}
      />
      <Box
        className="zoom-hint"
        aria-hidden
        sx={{
          position: "absolute",
          right: 8,
          bottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          color: "common.white",
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          fontSize: 12,
          transition: "opacity 150ms",
        }}
      >
        <ZoomInIcon sx={{ fontSize: 16 }} />
        Ampliar
      </Box>
    </ButtonBase>
  );
}

type StageState = "done" | "current" | "pending" | "cancelled";

// Con los colores de estatus del sistema: hecho = Cerrado (verde), en curso
// = En progreso (azul), cancelado = Cancelado (gris).
const stageColor = (status: string) => (theme: Theme) =>
  evidenceStatusColor(status, theme.palette.mode);

const STAGE_ICON: Record<StageState, ReactNode> = {
  done: <CheckCircleIcon sx={{ color: stageColor(STATUS_CLOSED) }} />,
  current: <AutorenewIcon sx={{ color: stageColor(STATUS_IN_PROGRESS) }} />,
  pending: <RadioButtonUncheckedIcon sx={{ color: "text.disabled" }} />,
  cancelled: <CancelIcon sx={{ color: stageColor(STATUS_CANCELLED) }} />,
};

/** Etapa del seguimiento: ícono con línea a la siguiente, título y detalle. */
function Stage({
  title,
  state,
  meta,
  last = false,
  children,
}: {
  title: string;
  state: StageState;
  meta?: ReactNode;
  last?: boolean;
  children?: ReactNode;
}) {
  return (
    <Stack component="li" direction="row" spacing={1.5}>
      <Stack sx={{ alignItems: "center" }} aria-hidden>
        {STAGE_ICON[state]}
        {!last && (
          <Box
            sx={{
              flex: 1,
              width: 2,
              my: 0.5,
              borderRadius: 1,
              backgroundColor:
                state === "done" ? stageColor(STATUS_CLOSED) : "divider",
            }}
          />
        )}
      </Stack>
      <Box sx={{ minWidth: 0, flex: 1, pb: last ? 0 : 3 }}>
        <Typography
          variant="subtitle1"
          component="h4"
          sx={{
            fontWeight: 700,
            lineHeight: 1.5,
            color: state === "pending" ? "text.secondary" : "text.primary",
          }}
        >
          {title}
        </Typography>
        {meta && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {meta}
          </Typography>
        )}
        {children && <Box sx={{ mt: 1.5 }}>{children}</Box>}
      </Box>
    </Stack>
  );
}

// Detalle de un hallazgo. Arriba, el resumen (qué, dónde, estatus, prioridad y
// plazo); a la izquierda, lo que se observó y el seguimiento por etapas con su
// foto y fecha; a la derecha, los datos; abajo, los comentarios. En celular,
// una sola columna en ese orden (los datos antes de los comentarios).
export default function DetailsEvidence({
  evidenceCurrent,
  setRefreshData,
}: Props) {
  const [comments, setComments] = useState<EvidenceRowComment[]>(
    evidenceCurrent.comments,
  );
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    setRefreshData(false);
  }, [setRefreshData]);

  const {
    status,
    imgEvidence,
    imgProcess,
    imgSolution,
    startProcessDate,
    solutionDate,
  } = evidenceCurrent;

  const photos = useMemo(
    () =>
      [
        imgEvidence && {
          key: "evidence",
          src: baseUrlImage(imgEvidence),
          title: "Foto del hallazgo",
        },
        imgProcess && {
          key: "process",
          src: baseUrlImage(imgProcess),
          title: "Foto del progreso",
        },
        imgSolution && {
          key: "solution",
          src: baseUrlImage(imgSolution),
          title: "Foto de la solución",
        },
      ].filter(Boolean) as (EvidencePhoto & { key: string })[],
    [imgEvidence, imgProcess, imgSolution],
  );

  const thumb = (key: string) => {
    const index = photos.findIndex((photo) => photo.key === key);
    if (index === -1) return null;
    return (
      <PhotoThumb photo={photos[index]} onOpen={() => setPhotoIndex(index)} />
    );
  };

  const priorityLabel = getPriorityLabel(evidenceCurrent.priorityDays);
  const riskLevel = getPriorityRiskLevel(evidenceCurrent.priorityDays);
  // Mismo plazo y tonos que la tabla y las tarjetas.
  const deadline = getDeadline(evidenceCurrent);
  const updatedLabel = updatedDateLabel(
    evidenceCurrent.createdAt,
    evidenceCurrent.updatedAt,
  );

  const responsibles =
    evidenceCurrent.responsibles.length > 0
      ? evidenceCurrent.responsibles
      : evidenceCurrent.supervisors;

  const isCancelled = status === STATUS_CANCELLED;
  const isClosed = status === STATUS_CLOSED;
  const isStarted = !!startProcessDate || !!imgProcess;
  const photoRequired = requiresPhotoEvidence(evidenceCurrent.mainType);
  // "fecha · quién". Sin quién en hallazgos anteriores a que se registrara.
  const withWho = (date: string, who?: { name: string } | null) =>
    who?.name ? `${date} · ${who.name}` : date;

  // Zona › lugar, sin repetir cuando se llaman igual.
  const place = [evidenceCurrent.zone.area?.name, evidenceCurrent.zone.name]
    .filter((name, index, names) => name && names.indexOf(name) === index)
    .join(" › ");

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        p: { xs: 2, sm: 3 },
        display: "grid",
        gap: { xs: 2, md: 3 },
        alignItems: "start",
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "minmax(0, 2fr) minmax(0, 1fr)",
        },
        gridTemplateAreas: {
          xs: `"summary" "main" "data" "comments"`,
          md: `"summary summary" "main data" "comments data"`,
        },
      }}
    >
      {/* Resumen */}
      <Box component="header" sx={{ gridArea: "summary" }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", lineHeight: 1.5 }}
        >
          {evidenceCurrent.manufacturingPlant.name}
        </Typography>
        <Typography
          variant="h5"
          component="h2"
          sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
        >
          {evidenceCurrent.mainType.name}
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {evidenceCurrent.secondaryType.name}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          <EvidenceStatusChip status={status} size="small" />
          {priorityLabel !== "Sin prioridad" && (
            // Con el tono de su nivel de riesgo, como en el dashboard.
            <StatusChip
              label={`Prioridad: ${priorityLabel}`}
              tone={riskLevel ? riskLevelTone(riskLevel) : "default"}
              size="small"
              variant="outlined"
            />
          )}
          {!photos.length && (
            <StatusChip
              label="Sin evidencia fotográfica"
              tone="warning"
              size="small"
              variant="outlined"
            />
          )}
          <EvidenceDeadline deadline={deadline} />
        </Stack>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ mt: 1.5, alignItems: "center", color: "text.secondary" }}
        >
          <PlaceOutlinedIcon fontSize="small" aria-hidden />
          <Typography variant="body2">
            {place}
            {evidenceCurrent.process?.name &&
              ` · Proceso: ${evidenceCurrent.process.name}`}
          </Typography>
        </Stack>
      </Box>

      {/* Lo que se observó y seguimiento */}
      <Stack spacing={{ xs: 2, md: 3 }} sx={{ gridArea: "main", minWidth: 0 }}>
        <DetailSection title="Lo que se observó">
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
          >
            {evidenceCurrent.description || "Sin descripción."}
          </Typography>
        </DetailSection>

        <DetailSection title="Seguimiento">
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
            <Stage
              title="Reportado"
              state="done"
              meta={`${stringToDateWithTime(evidenceCurrent.createdAt)} · ${evidenceCurrent.user.name}`}
            >
              {thumb("evidence") ?? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {photoRequired
                    ? "Sin foto."
                    : "Sin foto (esta clasificación no la exige)."}
                </Typography>
              )}
            </Stage>

            <Stage
              title="En progreso"
              state={
                isStarted
                  ? isClosed || isCancelled
                    ? "done"
                    : "current"
                  : "pending"
              }
              meta={
                startProcessDate
                  ? withWho(
                      stringToDateWithTime(startProcessDate),
                      evidenceCurrent.startedBy,
                    )
                  : isStarted
                    ? undefined
                    : isClosed || isCancelled
                      ? "No se registró el inicio."
                      : "Aún no se inicia."
              }
            >
              {thumb("process")}
            </Stage>

            {isCancelled ? (
              <Stage title="Cancelado" state="cancelled" last />
            ) : (
              <Stage
                title={isClosed ? "Cerrado" : "Cierre"}
                state={isClosed ? "done" : "pending"}
                meta={
                  isClosed && solutionDate
                    ? withWho(
                        stringToDateWithTime(solutionDate),
                        evidenceCurrent.closedBy,
                      )
                    : isClosed
                      ? undefined
                      : "Pendiente."
                }
                last
              >
                {(evidenceCurrent.descriptionSolution || imgSolution) && (
                  <Stack spacing={1.5}>
                    {evidenceCurrent.descriptionSolution && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Cómo se resolvió
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {evidenceCurrent.descriptionSolution}
                        </Typography>
                      </Box>
                    )}
                    {thumb("solution")}
                  </Stack>
                )}
              </Stage>
            )}
          </Box>
        </DetailSection>
      </Stack>

      {/* Datos */}
      <Box
        sx={{
          gridArea: "data",
          minWidth: 0,
          position: { md: "sticky" },
          top: { md: 88 },
        }}
      >
        <DetailSection title="Datos">
          <DetailFieldList>
            <DetailField label="Planta">
              {evidenceCurrent.manufacturingPlant.name}
            </DetailField>
            <DetailField label="Zona">
              {evidenceCurrent.zone.area?.name || "Sin zona"}
            </DetailField>
            <DetailField label="Lugar">{evidenceCurrent.zone.name}</DetailField>
            <DetailField label="Proceso">
              {evidenceCurrent.process?.name || "—"}
            </DetailField>
            <DetailField label="Reportado por">
              {evidenceCurrent.user.name}
            </DetailField>
            <DetailField
              label={responsibles.length === 1 ? "Responsable" : "Responsables"}
            >
              {responsibles.length
                ? responsibles.map((person) => (
                    <Box
                      component="span"
                      key={person.id}
                      sx={{ display: "block" }}
                    >
                      {person.name}
                    </Box>
                  ))
                : "—"}
            </DetailField>
            {/* Última reasignación de responsables: quién y cuándo (nulo en
                los nunca reasignados o reasignados antes de registrarse). */}
            {evidenceCurrent.reassignedBy && (
              <DetailField label="Reasignado por">
                {evidenceCurrent.reassignedBy.name}
                {evidenceCurrent.reassignedAt && (
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      typography: "body2",
                      color: "text.secondary",
                    }}
                  >
                    {stringToDateWithTime(evidenceCurrent.reassignedAt)}
                  </Box>
                )}
              </DetailField>
            )}
            <DetailField label="Prioridad">
              {priorityLabel !== "Sin prioridad" ? priorityLabel : "—"}
            </DetailField>
            <DetailField label="Registro">
              {stringToDateWithTime(evidenceCurrent.createdAt)}
            </DetailField>
            {/* Solo si se editó: igual a la de registro no aporta nada. */}
            {updatedLabel && (
              <DetailField label="Última actualización">
                {updatedLabel}
              </DetailField>
            )}
          </DetailFieldList>
        </DetailSection>
      </Box>

      {/* Comentarios */}
      <Box sx={{ gridArea: "comments", minWidth: 0 }}>
        <DetailSection title={`Comentarios (${comments.length})`}>
          <EvidenceComments
            evidenceId={evidenceCurrent.id}
            comments={comments}
            onCommentsChange={(next) => {
              setComments(next);
              setRefreshData(true);
            }}
          />
        </DetailSection>
      </Box>

      <EvidencePhotoViewer
        photos={photos}
        index={photoIndex}
        onChange={setPhotoIndex}
      />
    </Box>
  );
}
