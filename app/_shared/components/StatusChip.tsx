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
  evidenceStatusTone,
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

// Estatus de un hallazgo (Abierto, En progreso, Cerrado, Cancelado).
export function EvidenceStatusChip({
  status,
  ...props
}: Omit<StatusChipProps, "label" | "tone"> & { status: string }) {
  return (
    <StatusChip
      label={status}
      tone={evidenceStatusTone(status)}
      icon={STATUS_ICON[status] ?? <CancelOutlinedIcon />}
      {...props}
    />
  );
}
