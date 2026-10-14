"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { usePathname } from "next/navigation";

import {
  AppBar as MuiAppBar,
  AppBarProps as MuiAppBarProps,
} from "@mui/material";
import {
  alpha,
  useTheme,
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
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
import Highcharts from "highcharts/esm/highcharts.src.js";

import { MainListItems, UserFooter } from "@shared/components/menu";
import Copyright from "@shared/components/Copyright";
import { useUserSessionStore } from "@store";
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

const ColorModeContext = createContext({ toggleColorMode: () => {} });

function BtnChangeMode() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const pathname = usePathname();

  const modeCurrent = theme.palette.mode;

  const isLight = modeCurrent === "light";
  const isDark = modeCurrent === "dark";

  useEffect(() => {
    if (isDark) {
      Highcharts.setOptions({
        chart: {
          backgroundColor: "#303030",
        },
        title: {
          style: {
            color: "#fff",
          },
        },
        subtitle: {
          style: {
            color: "#fff",
          },
        },
        colors: [
          "#f45b5b",
          "#8085e9",
          "#8d4654",
          "#7798BF",
          "#aaeeee",
          "#ff0066",
          "#eeaaee",
          "#55BF3B",
          "#DF5353",
          "#7798BF",
          "#aaeeee",
        ],
      });
    } else if (isLight) {
      Highcharts.setOptions({
        chart: {
          backgroundColor: "#fff",
        },
        title: {
          style: {
            color: "#000",
          },
        },
        subtitle: {
          style: {
            color: "#000",
          },
        },
        colors: [
          "#7cb5ec",
          "#434348",
          "#90ed7d",
          "#f7a35c",
          "#8085e9",
          "#f15c80",
          "#e4d354",
          "#2b908f",
          "#f45b5b",
          "#91e8e1",
          "#aaeeee",
        ],
      });
    }
  }, [modeCurrent, isDark, isLight]);

  const handleToggleColorMode = () => {
    colorMode.toggleColorMode();
    localStorage.setItem("colorMode", isLight ? "dark" : "light");
    if (pathname === "/dashboard") {
      window.location.reload();
    }
  };

  return (
    <IconButton sx={{ ml: 1 }} onClick={handleToggleColorMode} color="inherit">
      {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { id: userId, name, setSession, role } = useUserSessionStore();


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

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    [],
  );

  const lightTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#71BF44",
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode,
      primary: {
        main: "#71BF44",
      },
    },
  });

  const theme = useMemo(
    () => createTheme(mode === "light" ? lightTheme : darkTheme),
    [mode, lightTheme, darkTheme],
  );

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
          justifyContent: "flex-end",
          px: [1],
          flexShrink: 0,
        }}
      >
        <IconButton onClick={toggleDrawer} aria-label="Cerrar menú">
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
      <UserFooter expanded={expanded} />
    </>
  );

  useEffect(() => {
    const colorModeCurrent = localStorage.getItem("colorMode") as
      | "light"
      | "dark";
    if (colorModeCurrent) {
      setMode(colorModeCurrent);
    }
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <CssBaseline />
          <AppBar position="absolute" open={open && !isMobile}>
            <Toolbar
              sx={{
                pr: "24px",
              }}
            >
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
                sx={{
                  marginRight: "36px",
                  ...(open && !isMobile && { display: "none" }),
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                {name} ({role})
              </Typography>
              {/* <IconButton color="inherit">
            <Badge badgeContent={4} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton> */}
              <BtnChangeMode />
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
            sx={{
              backgroundColor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],
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
    </ColorModeContext.Provider>
  );
}
