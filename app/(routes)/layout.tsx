"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
} from "@mui/material";
import { alpha, useTheme, ThemeProvider } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { CssBaseline } from "@mui/material";
import { IconButton } from "@mui/material";
import { Typography } from "@mui/material";
import { Container } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import { Drawer as MuiDrawer } from "@mui/material";
import { Toolbar } from "@mui/material";
import { Divider } from "@mui/material";
import { Box } from "@mui/material";
import { useMediaQuery } from "@mui/material";

import Image from "next/image";

import { MainListItems } from "@shared/components/menu";
import HeaderUserMenu from "@shared/components/HeaderUserMenu";
import Copyright from "@shared/components/Copyright";
import HalloweenSpider from "@shared/components/HalloweenSpider";
import ThemeSelector from "@shared/components/ThemeSelector";
import { useUserSessionStore } from "@store";
import { AppThemeName, createAppTheme, isAppThemeName } from "../theme";
import { UsersService } from "@services";

// Ancho suficiente para que ninguna etiqueta del menú se corte.
const drawerWidth: number = 300;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  // Superficie neutra con borde: el color queda para la marca y las acciones.
  backgroundColor: theme.palette.background.paper,
  backgroundImage: "none",
  color: theme.palette.text.primary,
  boxShadow: "none",
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    height: "100%",
    // La lista hace scroll por su cuenta y el pie queda fijo al fondo.
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// Clave de localStorage con el tema elegido ("light" | "dark" | "halloween").
const THEME_STORAGE_KEY = "colorMode";

// Marca: logo y nombre del producto. En modo oscuro el logo va en blanco
// monocromo; sus partes grises no se distinguen sobre fondo oscuro.
function Brand() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
      }}
    >
      <Image
        src="/images/logo-superior.png"
        alt="Hada International"
        width={61}
        height={36}
        priority
        style={{
          height: 36,
          width: "auto",
          ...(theme.palette.mode === "dark" && {
            filter: "brightness(0) invert(1)",
            opacity: 0.92,
          }),
        }}
      />
      <Divider
        orientation="vertical"
        flexItem
        sx={{ my: 1.5, display: { xs: "none", sm: "block" } }}
      />
      <Typography
        component="p"
        noWrap
        sx={{
          display: { xs: "none", sm: "block" },
          fontWeight: 600,
          fontSize: "1.0625rem",
          letterSpacing: "0.01em",
        }}
      >
        ComportArte
      </Typography>
    </Box>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<AppThemeName>("light");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userId = useUserSessionStore((state) => state.id);
  const setSession = useUserSessionStore((state) => state.setSession);

  useEffect(() => {
    if (!userId) {
      UsersService.getInformationCurrentUser().then((user) => {
        const { manufacturingPlants } = user;
        setSession({
          ...user,
          manufacturingPlantsCurrent:
            manufacturingPlants.length === 1 ? [manufacturingPlants[0].id] : [],
        });
      });
    }
  }, [userId, setSession]);

  const changeTheme = (name: AppThemeName) => {
    setThemeName(name);
    localStorage.setItem(THEME_STORAGE_KEY, name);
  };

  // El theme solo se crea de nuevo al cambiar de tema.
  const theme = useMemo(() => createAppTheme(themeName), [themeName]);

  // En móvil y tablet el menú es temporal (se superpone al contenido).
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const expanded = isMobile || open;

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  };

  const closeMobileDrawer = () => {
    if (isMobile) setMobileOpen(false);
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "space-between" : "flex-end",
          gap: 1,
          px: [2, 2, 2],
          flexShrink: 0,
        }}
      >
        {expanded && <Brand />}
        <IconButton
          onClick={toggleDrawer}
          aria-label="Cerrar menú"
          sx={{ color: "text.secondary" }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <Box
        sx={(theme) => ({
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${alpha(theme.palette.text.primary, 0.2)} transparent`,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(theme.palette.text.primary, 0.2),
            borderRadius: 3,
          },
        })}
      >
        <MainListItems expanded={expanded} onNavigate={closeMobileDrawer} />
      </Box>
    </>
  );

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isAppThemeName(saved)) {
      setThemeName(saved);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {/* Color de las barras del sistema (arriba y abajo en la app
          instalada; la barra del navegador en móvil). Sigue al tema, igual
          que la barra superior de la app, para que Android elija iconos
          oscuros en claro y claros en oscuro. React lo coloca en <head>. */}
      <meta name="theme-color" content={theme.palette.background.paper} />
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          // Scrollbars y controles nativos acordes al modo (se hereda).
          colorScheme: theme.palette.mode,
        }}
      >
        <CssBaseline />
        <Box
          component="a"
          href="#contenido"
          sx={(theme) => ({
            position: "absolute",
            left: 8,
            top: -64,
            zIndex: theme.zIndex.tooltip,
            px: 2,
            py: 1,
            borderRadius: `${theme.tokens.radius.md}px`,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: 3,
            textDecoration: "none",
            fontWeight: 600,
            "&:focus": { top: 8 },
          })}
        >
          Saltar al contenido
        </Box>
        <AppBar position="absolute" open={open && !isMobile}>
          <Toolbar sx={{ gap: 1, px: { xs: 1.5, sm: 2.5 } }}>
            <IconButton
              edge="start"
              aria-label="Abrir menú"
              onClick={toggleDrawer}
              sx={{
                color: "text.secondary",
                ...(open && !isMobile && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            {/* Con el menú lateral abierto la marca vive arriba del menú. */}
            {!(open && !isMobile) && <Brand />}
            {themeName === "halloween" && <HalloweenSpider />}
            <Box sx={{ flexGrow: 1 }} />
            <ThemeSelector value={themeName} onChange={changeTheme} />
            <Divider
              orientation="vertical"
              flexItem
              sx={{ my: 1.5, mx: 0.5 }}
            />
            <HeaderUserMenu />
          </Toolbar>
        </AppBar>
        {isMobile ? (
          <MuiDrawer
            variant="temporary"
            open={mobileOpen}
            onClose={closeMobileDrawer}
            keepMounted
            slotProps={{
              paper: {
                sx: {
                  width: drawerWidth,
                  maxWidth: "85vw",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                },
              },
            }}
          >
            {drawerContent}
          </MuiDrawer>
        ) : (
          <Drawer variant="permanent" open={open}>
            {drawerContent}
          </Drawer>
        )}
        <Box
          component="main"
          id="contenido"
          tabIndex={-1}
          sx={{
            "&:focus": { outline: "none" },
            backgroundColor: (theme) =>
              ({
                light: theme.palette.grey[100],
                dark: theme.palette.grey[900],
                halloween: theme.palette.background.default,
              })[theme.appTheme],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
            {children}
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
