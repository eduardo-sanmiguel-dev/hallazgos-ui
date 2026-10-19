"use client";

import { MouseEvent, useId, useState } from "react";

import { useRouter } from "next/navigation";

import { Avatar } from "@mui/material";
import { Box } from "@mui/material";
import { ButtonBase } from "@mui/material";
import { Chip } from "@mui/material";
import { Divider } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import FactoryOutlinedIcon from "@mui/icons-material/FactoryOutlined";

import { useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { notify } from "@shared/utils";
import { AuthService } from "@services";

const initialsOf = (name: string, email: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length) {
    return words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  return (email[0] || "?").toUpperCase();
};

// Usuario en sesión (avatar en el header) con su información y "Salir".
export default function HeaderUserMenu() {
  const router = useRouter();
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { name, email, role, manufacturingPlants, resetSession } =
    useUserSessionStore();

  const displayName = name || email;
  const roleLabel = role === ROLE_ADMINISTRADOR ? "Administrador" : "Usuario";
  const initials = initialsOf(name || "", email || "");
  const isOpen = Boolean(anchorEl);

  const logout = () => {
    setAnchorEl(null);
    AuthService.logout().then(({ message }) => {
      notify(message, true);
      router.push("/");
      setTimeout(() => {
        resetSession();
      }, 1000);
    });
  };

  const avatar = (size: number) => (
    <Avatar
      sx={(theme) => ({
        width: size,
        height: size,
        fontSize: size > 36 ? "1rem" : "0.8125rem",
        fontWeight: 600,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      })}
    >
      {initials}
    </Avatar>
  );

  return (
    <>
      <ButtonBase
        onClick={(event: MouseEvent<HTMLElement>) =>
          setAnchorEl(event.currentTarget)
        }
        aria-label={`Cuenta de ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          py: 0.5,
          pl: 0.5,
          pr: { xs: 0.5, md: 1 },
          borderRadius: 999,
          textAlign: "left",
          transition: theme.transitions.create("background-color", {
            duration: 150,
          }),
          "&:hover": {
            backgroundColor: alpha(theme.palette.text.primary, 0.06),
          },
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
        {avatar(34)}
        <Box sx={{ display: { xs: "none", md: "block" }, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{
              fontWeight: 600,
              lineHeight: 1.25,
              maxWidth: 200,
              color: "text.primary",
            }}
          >
            {displayName}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            component="div"
            sx={{ lineHeight: 1.2, color: "text.secondary" }}
          >
            {roleLabel}
          </Typography>
        </Box>
        <KeyboardArrowDownIcon
          fontSize="small"
          aria-hidden
          sx={{
            display: { xs: "none", md: "block" },
            color: "text.secondary",
            transition: "transform 150ms",
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        />
      </ButtonBase>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: { mt: 1, width: 300, maxWidth: "calc(100vw - 32px)" },
          },
        }}
      >
        <Box sx={{ display: "flex", gap: 1.5, px: 2, pt: 1, pb: 1.5 }}>
          {avatar(44)}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
            {name && email && (
              <Typography
                variant="body2"
                noWrap
                component="div"
                sx={{ color: "text.secondary" }}
              >
                {email}
              </Typography>
            )}
            <Chip
              label={roleLabel}
              size="small"
              color={role === ROLE_ADMINISTRADOR ? "primary" : "default"}
              variant="outlined"
              sx={{ mt: 0.75, height: 22, fontSize: "0.75rem" }}
            />
          </Box>
        </Box>

        {manufacturingPlants.length > 0 && (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography
              variant="caption"
              component="div"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                mb: 0.5,
              }}
            >
              <FactoryOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
              {manufacturingPlants.length === 1 ? "Planta" : "Plantas"}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "normal" }}>
              {manufacturingPlants.map((plant) => plant.name).join(", ")}
            </Typography>
          </Box>
        )}

        <Divider />
        <MenuItem
          onClick={logout}
          sx={(theme) => ({
            mt: 0.5,
            py: 1.25,
            "&:hover": {
              color: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.08),
              "& .MuiListItemIcon-root": { color: theme.palette.error.main },
            },
          })}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Menu>
    </>
  );
}
