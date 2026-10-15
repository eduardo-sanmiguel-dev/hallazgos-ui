import { ReactElement, ReactNode } from "react";

import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import { alpha, darken, lighten } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

type ActionTone = "primary" | "warning" | "error";

interface RowActionProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

// Fondo tenue y texto oscurecido del tono, para cumplir contraste AA (el
// warning sólido de MUI con texto blanco queda en ~3:1).
const toneSx = (tone: ActionTone) => (theme: Theme) => {
  const { main } = theme.palette[tone];
  const isLight = theme.palette.mode === "light";

  return {
    backgroundColor: alpha(main, isLight ? 0.12 : 0.2),
    color: isLight ? darken(main, 0.45) : lighten(main, 0.45),
    "& .MuiChip-icon": { color: "inherit" },
    "&:hover, &.Mui-focusVisible": {
      backgroundColor: alpha(main, isLight ? 0.2 : 0.3),
    },
  };
};

interface RowActionBaseProps extends Required<RowActionProps> {
  tone: ActionTone;
  icon: ReactElement;
}

function RowAction({ tone, icon, label, onClick, disabled }: RowActionBaseProps) {
  return (
    <Chip
      icon={icon}
      label={label}
      onClick={onClick}
      disabled={disabled}
      sx={toneSx(tone)}
    />
  );
}

// Contenedor de las acciones de una fila de tabla.
export function RowActions({ children }: { children: ReactNode }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {children}
    </Stack>
  );
}

export function EditAction({
  label = "Editar",
  disabled = false,
  onClick,
}: RowActionProps) {
  return (
    <RowAction
      tone="warning"
      icon={<EditIcon />}
      label={label}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

export function DeleteAction({
  label = "Eliminar",
  disabled = false,
  onClick,
}: RowActionProps) {
  return (
    <RowAction
      tone="error"
      icon={<DeleteIcon />}
      label={label}
      disabled={disabled}
      onClick={onClick}
    />
  );
}

export function ViewAction({
  label = "Ver",
  disabled = false,
  onClick,
}: RowActionProps) {
  return (
    <RowAction
      tone="primary"
      icon={<VisibilityIcon />}
      label={label}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
