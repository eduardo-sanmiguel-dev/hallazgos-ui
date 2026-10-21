import { ReactElement, useId, useState } from "react";

import { IconButton } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { SvgIcon, SvgIconProps } from "@mui/material";
import { Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

import type { AppThemeName } from "../../theme";

// Calabaza para el tema de Halloween (MUI no trae una).
export function PumpkinIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M11.3 6.1c-.1-1.4.4-2.7 1.5-3.6l1 .9c-.7.6-1 1.5-1 2.6z" />
      <path
        fillRule="evenodd"
        d="M8 6.6c-3.2 0-5.5 2.9-5.5 6.7S4.8 20 8 20c1 0 1.9-.3 2.6-.7.4.2.9.3 1.4.3s1-.1 1.4-.3c.7.4 1.6.7 2.6.7 3.2 0 5.5-2.9 5.5-6.7s-2.3-6.7-5.5-6.7c-1 0-1.9.3-2.6.7-.4-.2-.9-.3-1.4-.3s-1 .1-1.4.3C9.9 6.9 9 6.6 8 6.6zm1.2 2.5c-.9 1-1.4 2.5-1.4 4.2s.5 3.2 1.4 4.2l.9-.8c-.6-.7-1-2-1-3.4s.4-2.7 1-3.4zm5.6 0-.9.8c.6.7 1 2 1 3.4s-.4 2.7-1 3.4l.9.8c.9-1 1.4-2.5 1.4-4.2s-.5-3.2-1.4-4.2z"
      />
    </SvgIcon>
  );
}

const OPTIONS: Record<
  AppThemeName,
  { label: string; icon: ReactElement<SvgIconProps> }
> = {
  light: { label: "Claro", icon: <LightModeOutlinedIcon /> },
  dark: { label: "Oscuro", icon: <DarkModeOutlinedIcon /> },
  halloween: { label: "Halloween", icon: <PumpkinIcon /> },
};

interface Props {
  value: AppThemeName;
  onChange: (value: AppThemeName) => void;
}

// Menú del header para elegir el tema de la aplicación.
export default function ThemeSelector({ value, onChange }: Props) {
  const buttonId = useId();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;
  const current = OPTIONS[value];

  const select = (name: AppThemeName) => {
    onChange(name);
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={`Tema: ${current.label}`}>
        <IconButton
          id={buttonId}
          aria-label={`Cambiar tema (actual: ${current.label})`}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-expanded={open}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{
            color: value === "halloween" ? "primary.main" : "text.secondary",
          }}
        >
          {current.icon}
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { "aria-labelledby": buttonId, dense: true },
          paper: { sx: { minWidth: 200, mt: 0.5 } },
        }}
      >
        {(Object.keys(OPTIONS) as AppThemeName[]).map((name) => {
          const selected = name === value;
          return (
            <MenuItem
              key={name}
              role="menuitemradio"
              aria-checked={selected}
              selected={selected}
              onClick={() => select(name)}
            >
              <ListItemIcon
                sx={{ color: selected ? "primary.main" : "text.secondary" }}
              >
                {OPTIONS[name].icon}
              </ListItemIcon>
              <ListItemText>{OPTIONS[name].label}</ListItemText>
              {selected && (
                <CheckIcon
                  fontSize="small"
                  aria-hidden
                  sx={{ ml: 2, color: "primary.main" }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
