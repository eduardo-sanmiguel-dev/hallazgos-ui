import { ReactElement } from "react";

import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

import {
  STATUS_CLOSED,
  STATUS_IN_PROGRESS,
  STATUS_OPEN,
} from "@shared/constants";
import {
  EVIDENCE_STATUS_COLOR,
  SemanticTone,
  STATUS_CANCELLED,
} from "@shared/constants/semanticTones";

const STATUS_ICON: Record<string, ReactElement> = {
  [STATUS_OPEN]: <HourglassEmptyIcon />,
  [STATUS_IN_PROGRESS]: <PendingActionsIcon />,
  [STATUS_CLOSED]: <CheckCircleOutlineIcon />,
  [STATUS_CANCELLED]: <CancelOutlinedIcon />,
};

type StatusChipProps = Omit<ChipProps, "color" | "label" | "icon"> & {
  label: string;
  tone?: SemanticTone;
  icon?: ReactElement;
};

// Chip con color semántico. El color nunca va solo: siempre lleva texto y,
// en estatus de hallazgo, ícono (se distingue sin ver colores).
export default function StatusChip({
  label,
  tone = "default",
  ...props
}: StatusChipProps) {
  return <Chip label={label} color={tone} {...props} />;
}

// Estatus de un hallazgo (Abierto, En progreso, Cerrado, Cancelado), con el
// color del estatus de todo el sistema (relleno con texto blanco, AA en los
// tres temas).
export function EvidenceStatusChip({
  status,
  sx,
  ...props
}: Omit<StatusChipProps, "label" | "tone"> & { status: string }) {
  const color = EVIDENCE_STATUS_COLOR[status];

  return (
    <Chip
      label={status}
      icon={STATUS_ICON[status] ?? <CancelOutlinedIcon />}
      sx={[
        !!color && {
          backgroundColor: color.main,
          color: "#fff",
          "& .MuiChip-icon": { color: "inherit" },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
