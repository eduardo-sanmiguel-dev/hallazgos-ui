import { ReactElement, useId, useState } from "react";

import { IconButton } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { SvgIconProps } from "@mui/material";
import { Tooltip } from "@mui/material";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

import type { ThemePreference } from "../../theme";

const OPTIONS: Record<
  ThemePreference,
  { label: string; icon: ReactElement<SvgIconProps> }
> = {
  system: { label: "Sistema", icon: <SettingsBrightnessOutlinedIcon /> },
  light: { label: "Claro", icon: <LightModeOutlinedIcon /> },
  dark: { label: "Oscuro", icon: <DarkModeOutlinedIcon /> },
};

interface Props {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

// Menú del header para elegir el tema de la aplicación.
export default function ThemeSelector({ value, onChange }: Props) {
  const buttonId = useId();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = !!anchorEl;
  const current = OPTIONS[value];

  const select = (name: ThemePreference) => {
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
            color: "text.secondary",
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
        {(Object.keys(OPTIONS) as ThemePreference[]).map((name) => {
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
                sx={{ color: selected ? "text.brand" : "text.secondary" }}
              >
                {OPTIONS[name].icon}
              </ListItemIcon>
              <ListItemText>{OPTIONS[name].label}</ListItemText>
              {selected && (
                <CheckIcon
                  fontSize="small"
                  aria-hidden
                  sx={{ ml: 2, color: "text.brand" }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
