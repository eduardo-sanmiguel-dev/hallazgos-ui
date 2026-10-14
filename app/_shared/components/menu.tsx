"use client";

import {
  Fragment,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import { Avatar } from "@mui/material";
import { Box } from "@mui/material";
import { Collapse } from "@mui/material";
import { Divider } from "@mui/material";
import { IconButton } from "@mui/material";
import { List } from "@mui/material";
import { ListItemButton } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListSubheader } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Tooltip } from "@mui/material";
import { Typography } from "@mui/material";
import { alpha, darken } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import LogoutIcon from "@mui/icons-material/Logout";
import FactoryIcon from "@mui/icons-material/Factory";
import RuleIcon from "@mui/icons-material/Rule";
import CategoryIcon from "@mui/icons-material/Category";
import PlaceIcon from "@mui/icons-material/Place";
import SchemaIcon from "@mui/icons-material/Schema";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SchoolIcon from "@mui/icons-material/School";
import ExpandMore from "@mui/icons-material/ExpandMore";
import BadgeIcon from "@mui/icons-material/Badge";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import MapIcon from "@mui/icons-material/Map";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import GridViewIcon from "@mui/icons-material/GridView";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import TuneIcon from "@mui/icons-material/Tune";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonalInjuryIcon from "@mui/icons-material/PersonalInjury";
import EngineeringIcon from "@mui/icons-material/Engineering";
import ScienceIcon from "@mui/icons-material/Science";
import LabelIcon from "@mui/icons-material/Label";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import RouteIcon from "@mui/icons-material/Route";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

import { useCategoriesStore, useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { notify } from "@shared/utils";
import {
  AuthService,
  GembaWalksService,
  MainTypesService,
  ProcessesService,
  ZonesService,
} from "@services";

// Usuarios que solo usan EPP: ven EPP e inspección de extintores, pero no
// Guías de entrenamiento ni HDS.
const EPP_USER_EMAILS = ["malonso@hadainternational.com"];

// Cuenta que en la navegación principal solo tiene acceso a HDS.
const HDS_ONLY_EMAIL = "cosmeticostrujillo0023@gmail.com";

interface MenuContext {
  isAdmin: boolean;
  email: string;
  isGembaWalkObserver: boolean;
}

interface MenuLinkConfig {
  url: string;
  title: string;
  tooltip?: string;
  icon: ReactNode;
  // Por defecto se marca cuando la ruta actual empieza con `url`.
  isSelected?: (pathname: string) => boolean;
  // Sin `visible`, la opción se muestra a todos.
  visible?: (ctx: MenuContext) => boolean;
}

interface MenuGroupConfig {
  id: string;
  title: string;
  icon: ReactNode;
  items: MenuLinkConfig[];
}

type MenuEntry = MenuLinkConfig | MenuGroupConfig;

interface MenuSection {
  // Sin título no se pinta encabezado.
  title?: string;
  entries: MenuEntry[];
}

const isGroup = (entry: MenuEntry): entry is MenuGroupConfig =>
  "items" in entry;

const adminOnly = ({ isAdmin }: MenuContext) => isAdmin;

const eppAccess = ({ isAdmin, email }: MenuContext) =>
  isAdmin || EPP_USER_EMAILS.includes(email);

const notEppUser = ({ email }: MenuContext) =>
  !EPP_USER_EMAILS.includes(email);

const gembaWalkAccess = ({ isAdmin, isGembaWalkObserver }: MenuContext) =>
  isGembaWalkObserver || isAdmin;

const HDS_LINK: MenuLinkConfig = {
  url: "/hds",
  title: "HDS",
  tooltip: "Hojas de datos de seguridad",
  icon: <ScienceIcon />,
};

const ANALYSIS_SECTION: MenuSection = {
  title: "Análisis de datos",
  entries: [
    {
      url: "/business-intelligence/epp",
      title: "EPP",
      tooltip: "Equipos de protección personal",
      icon: <InsightsIcon />,
    },
  ],
};

const MENU_SECTIONS: MenuSection[] = [
  {
    entries: [
      { url: "/dashboard", title: "Dashboard", icon: <SpaceDashboardIcon /> },
    ],
  },
  {
    title: "Seguridad",
    entries: [
      {
        url: "/hallazgos",
        title: "Hallazgos",
        icon: <ContentPasteSearchIcon />,
      },
      {
        url: "/ics",
        title: "Comportamiento seguro (ICS)",
        tooltip: "Índice de comportamiento seguro",
        icon: <VerifiedUserIcon />,
        visible: adminOnly,
      },
      {
        url: "/gemba-walk",
        title: "Gemba Walk",
        tooltip: "Gemba Walk - Recorridos",
        icon: <DirectionsWalkIcon />,
        visible: gembaWalkAccess,
        // No se marca en las pantallas de configuración de Gemba Walk.
        isSelected: (pathname) =>
          pathname === "/gemba-walk" ||
          pathname.startsWith("/gemba-walk/form") ||
          pathname.startsWith("/gemba-walk/view") ||
          pathname.startsWith("/gemba-walk/schedule"),
      },
      {
        url: "/extinguisher-inspection",
        title: "Inspección de extintores",
        icon: <FireExtinguisherIcon />,
        visible: eppAccess,
      },
      {
        url: "/ciael",
        title: "CIAEL",
        tooltip:
          "Caracterización de incidentes, accidentes y enfermedades laborales",
        icon: <PersonalInjuryIcon />,
        visible: adminOnly,
      },
    ],
  },
  {
    title: "Protección y capacitación",
    entries: [
      {
        url: "/epp",
        title: "EPP",
        tooltip: "Equipos de protección personal",
        icon: <EngineeringIcon />,
        visible: eppAccess,
      },
      {
        url: "/training-guide",
        title: "Guías de entrenamiento",
        icon: <SchoolIcon />,
        visible: notEppUser,
      },
      { ...HDS_LINK, visible: notEppUser },
    ],
  },
  ANALYSIS_SECTION,
  {
    title: "Configuración",
    entries: [
      {
        id: "general",
        title: "General",
        icon: <TuneIcon />,
        items: [
          {
            url: "/users",
            title: "Usuarios",
            icon: <ManageAccountsIcon />,
            visible: adminOnly,
          },
          {
            url: "/employees",
            title: "Colaboradores",
            icon: <BadgeIcon />,
            visible: adminOnly,
          },
          {
            url: "/manufacturing-plants",
            title: "Plantas",
            icon: <FactoryIcon />,
            visible: adminOnly,
          },
          // `/zones` es "Lugares" y `/areas` es "Zonas".
          {
            url: "/zones",
            title: "Lugares",
            icon: <PlaceIcon />,
            visible: adminOnly,
          },
          {
            url: "/areas",
            title: "Zonas",
            icon: <MapIcon />,
            visible: adminOnly,
          },
          {
            url: "/processes",
            title: "Procesos",
            icon: <SchemaIcon />,
            visible: adminOnly,
          },
        ],
      },
      {
        id: "criteria",
        title: "Criterios",
        icon: <RuleIcon />,
        items: [
          {
            url: "/main-types",
            title: "Criterios",
            icon: <LabelIcon />,
            visible: adminOnly,
          },
          {
            url: "/secondary-types",
            title: "Tipos de criterios",
            icon: <CategoryIcon />,
            visible: adminOnly,
          },
        ],
      },
      {
        id: "equipment",
        title: "Equipos",
        icon: <Inventory2Icon />,
        items: [
          {
            url: "/equipments",
            title: "Equipo de protección",
            icon: <HealthAndSafetyIcon />,
            visible: adminOnly,
          },
          {
            url: "/emergency-teams",
            title: "Equipos de emergencia",
            icon: <LocalFireDepartmentIcon />,
            visible: adminOnly,
          },
        ],
      },
      {
        id: "training",
        title: "Entrenamiento",
        icon: <ModelTrainingIcon />,
        items: [
          {
            url: "/topics-tg",
            title: "Temas",
            tooltip: "Temas - Guías de entrenamiento",
            icon: <MenuBookIcon />,
            visible: adminOnly,
          },
          {
            url: "/config-tg",
            title: "Configuración",
            tooltip: "Configuración - Guías de entrenamiento",
            icon: <AssignmentIndIcon />,
            visible: adminOnly,
          },
        ],
      },
      {
        id: "gemba-walk",
        title: "Gemba Walk",
        icon: <RouteIcon />,
        items: [
          {
            url: "/gemba-walk/zones",
            title: "Zonas",
            tooltip: "Gemba Walk - Zonas",
            icon: <GridViewIcon />,
            visible: adminOnly,
          },
          {
            url: "/gemba-walk/observers",
            title: "Observadores",
            tooltip: "Gemba Walk - Observadores",
            icon: <PersonSearchIcon />,
            visible: adminOnly,
          },
          {
            url: "/gemba-walk/calendar",
            title: "Calendario",
            tooltip: "Gemba Walk - Calendario",
            icon: <CalendarMonthIcon />,
            visible: adminOnly,
          },
          {
            url: "/gemba-walk/evaluations",
            title: "Evaluaciones",
            tooltip: "Gemba Walk - Conceptos de evaluación",
            icon: <FactCheckIcon />,
            visible: adminOnly,
          },
        ],
      },
    ],
  },
];

const HDS_ONLY_SECTIONS: MenuSection[] = [
  { entries: [HDS_LINK] },
  ANALYSIS_SECTION,
];

const isLinkVisible = (link: MenuLinkConfig, ctx: MenuContext) =>
  link.visible ? link.visible(ctx) : true;

// Quita opciones no visibles, grupos sin opciones y secciones vacías.
const visibleSections = (sections: MenuSection[], ctx: MenuContext) =>
  sections
    .map((section) => ({
      ...section,
      entries: section.entries.flatMap<MenuEntry>((entry) => {
        if (!isGroup(entry)) return isLinkVisible(entry, ctx) ? [entry] : [];

        const items = entry.items.filter((item) => isLinkVisible(item, ctx));
        return items.length ? [{ ...entry, items }] : [];
      }),
    }))
    .filter((section) => section.entries.length);

const isLinkSelected = (link: MenuLinkConfig, pathname: string) =>
  link.isSelected ? link.isSelected(pathname) : pathname.startsWith(link.url);

// Color del item activo: en modo claro se oscurece el primario para que el
// texto cumpla contraste AA sobre el fondo translúcido.
const activeColor = (theme: Theme) =>
  theme.palette.mode === "light"
    ? darken(theme.palette.primary.main, 0.45)
    : theme.palette.primary.light;

const navItemSx =
  (expanded: boolean, nested = false) =>
  (theme: Theme) => ({
    position: "relative",
    minHeight: 44,
    mx: 1,
    my: 0.25,
    px: expanded ? 1.5 : 0,
    justifyContent: expanded ? "flex-start" : "center",
    borderRadius: "10px",
    color: theme.palette.text.primary,
    transition: theme.transitions.create(["background-color", "color"], {
      duration: 150,
    }),
    "& .MuiListItemIcon-root": {
      minWidth: expanded ? 36 : 0,
      color: theme.palette.text.secondary,
      transition: theme.transitions.create(["color", "transform"], {
        duration: 150,
      }),
    },
    "& .MuiSvgIcon-root": { fontSize: nested ? 20 : 22 },
    "& .MuiListItemText-root": { my: 0 },
    "& .MuiListItemText-primary": {
      fontSize: "0.875rem",
      whiteSpace: "nowrap",
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      "& .MuiListItemIcon-root": {
        color: activeColor(theme),
        transform: "translateX(2px)",
      },
    },
    "&.Mui-selected": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
      color: activeColor(theme),
      "& .MuiListItemIcon-root": { color: activeColor(theme) },
      "& .MuiListItemText-primary": { fontWeight: 600 },
      "&::before": {
        content: '""',
        position: "absolute",
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: 3,
        backgroundColor: activeColor(theme),
      },
    },
    "&.Mui-selected:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.18),
    },
    "&.Mui-focusVisible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  });

function SectionHeader({
  title,
  expanded,
}: {
  title: string;
  expanded: boolean;
}) {
  if (!expanded) return <Divider sx={{ my: 1, mx: 1.5 }} />;

  return (
    <ListSubheader
      component="div"
      disableSticky
      sx={{
        pt: 2.5,
        pb: 0.75,
        px: 2.5,
        lineHeight: 1.5,
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "text.secondary",
        backgroundColor: "transparent",
      }}
    >
      {title}
    </ListSubheader>
  );
}

function NavLink({
  link,
  expanded,
  nested = false,
  onNavigate,
}: {
  link: MenuLinkConfig;
  expanded: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tooltip title={link.tooltip || link.title} placement="right">
      <ListItemButton
        onClick={() => {
          router.push(link.url);
          onNavigate?.();
        }}
        selected={isLinkSelected(link, pathname)}
        sx={navItemSx(expanded, nested)}
      >
        <ListItemIcon>{link.icon}</ListItemIcon>
        {expanded && <ListItemText primary={link.title} />}
      </ListItemButton>
    </Tooltip>
  );
}

function NavGroup({
  group,
  expanded,
  open,
  onToggle,
  onNavigate,
}: {
  group: MenuGroupConfig;
  expanded: boolean;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const openedByUser = useRef(false);

  const containsActive = group.items.some((item) =>
    isLinkSelected(item, pathname),
  );
  const listId = `menu-group-${group.id}`;

  // Colapsado (solo íconos): las opciones se abren en un menú flotante.
  if (!expanded) {
    const navigate = (url: string) => {
      setAnchorEl(null);
      router.push(url);
      onNavigate?.();
    };

    return (
      <>
        <Tooltip title={group.title} placement="right">
          <ListItemButton
            onClick={(event: MouseEvent<HTMLElement>) =>
              setAnchorEl(event.currentTarget)
            }
            selected={containsActive}
            aria-haspopup="menu"
            aria-expanded={!!anchorEl}
            aria-controls={anchorEl ? listId : undefined}
            sx={navItemSx(false)}
          >
            <ListItemIcon>{group.icon}</ListItemIcon>
          </ListItemButton>
        </Tooltip>
        <Menu
          id={listId}
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{ paper: { sx: { ml: 1, minWidth: 220 } } }}
        >
          <ListSubheader
            sx={{
              lineHeight: 2.5,
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {group.title}
          </ListSubheader>
          {group.items.map((item) => (
            <MenuItem
              key={item.url}
              selected={isLinkSelected(item, pathname)}
              onClick={() => navigate(item.url)}
              sx={{ minHeight: 44 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }

  // Al abrir el grupo con un clic, se desplaza la lista para que se vean sus
  // opciones completas.
  const scrollIntoView = () => {
    if (!openedByUser.current) return;
    openedByUser.current = false;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    groupRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  };

  return (
    <Box ref={groupRef}>
      <Tooltip title={group.title} placement="right">
        <ListItemButton
          onClick={() => {
            openedByUser.current = !open;
            onToggle();
          }}
          // Cerrado, el grupo se marca si la ruta actual está dentro.
          selected={!open && containsActive}
          aria-expanded={open}
          aria-controls={listId}
          sx={navItemSx(true)}
        >
          <ListItemIcon>{group.icon}</ListItemIcon>
          <ListItemText primary={group.title} />
          <ExpandMore
            sx={(theme) => ({
              ml: 1,
              color: "text.secondary",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: theme.transitions.create("transform", {
                duration: 200,
              }),
            })}
          />
        </ListItemButton>
      </Tooltip>
      <Collapse
        in={open}
        timeout="auto"
        unmountOnExit
        onEntered={scrollIntoView}
      >
        <List
          id={listId}
          component="div"
          disablePadding
          sx={{
            position: "relative",
            ml: 4,
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 4,
              bottom: 4,
              width: "1px",
              backgroundColor: "divider",
            },
          }}
        >
          {group.items.map((item) => (
            <NavLink
              key={item.url}
              link={item}
              expanded
              nested
              onNavigate={onNavigate}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
}

export const MainListItems = ({
  expanded = true,
  onNavigate,
}: {
  expanded?: boolean;
  // Se llama al elegir una opción (en móvil cierra el menú).
  onNavigate?: () => void;
}) => {
  const [isGembaWalkObserver, setIsGembaWalkObserver] = useState(false);

  const role = useUserSessionStore((state) => state.role);
  const email = useUserSessionStore((state) => state.email);
  const pathname = usePathname();

  const isAdmin = role === ROLE_ADMINISTRADOR;

  const { setCategories } = useCategoriesStore();

  const initialCategories = useCallback(async () => {
    const [mainTypes, zones, processes] = await Promise.all([
      MainTypesService.findAll({}),
      ZonesService.findAll({}),
      ProcessesService.findAll({}),
    ]);

    setCategories({
      mainTypes,
      zones,
      processes,
    });
  }, [setCategories]);

  useEffect(() => {
    initialCategories();
  }, [initialCategories]);

  // El módulo de recorridos se muestra a los observadores de Gemba Walk y al
  // administrador.
  useEffect(() => {
    GembaWalksService.access()
      .then(({ isObserver }) => setIsGembaWalkObserver(isObserver))
      .catch(() => setIsGembaWalkObserver(false));
  }, []);

  const sections = visibleSections(
    email === HDS_ONLY_EMAIL ? HDS_ONLY_SECTIONS : MENU_SECTIONS,
    { isAdmin, email, isGembaWalkObserver },
  );

  // Grupo que contiene la ruta actual: se abre automáticamente.
  const activeGroupId =
    sections
      .flatMap((section) => section.entries)
      .filter(isGroup)
      .find((group) =>
        group.items.some((item) => isLinkSelected(item, pathname)),
      )?.id ?? null;

  // Acordeón: un solo grupo abierto a la vez.
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    activeGroupId,
  );
  const [lastActiveGroupId, setLastActiveGroupId] = useState(activeGroupId);

  if (activeGroupId !== lastActiveGroupId) {
    setLastActiveGroupId(activeGroupId);
    if (activeGroupId) setOpenGroupId(activeGroupId);
  }

  return (
    <List component="nav" aria-label="Menú principal" sx={{ py: 1 }}>
      {sections.map((section, index) => (
        <Fragment key={section.title ?? index}>
          {section.title && (
            <SectionHeader title={section.title} expanded={expanded} />
          )}
          {section.entries.map((entry) =>
            isGroup(entry) ? (
              <NavGroup
                key={entry.id}
                group={entry}
                expanded={expanded}
                open={openGroupId === entry.id}
                onToggle={() =>
                  setOpenGroupId((prev) =>
                    prev === entry.id ? null : entry.id,
                  )
                }
                onNavigate={onNavigate}
              />
            ) : (
              <NavLink
                key={entry.url}
                link={entry}
                expanded={expanded}
                onNavigate={onNavigate}
              />
            ),
          )}
        </Fragment>
      ))}
    </List>
  );
};

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

// Pie fijo del menú: perfil del usuario y botón para salir.
export const UserFooter = ({ expanded = true }: { expanded?: boolean }) => {
  const router = useRouter();
  const { name, email, role, resetSession } = useUserSessionStore();

  const displayName = name || email;
  const roleLabel = role === ROLE_ADMINISTRADOR ? "Administrador" : "Usuario";
  const initials = initialsOf(name || "", email || "");

  const logout = () => {
    AuthService.logout().then(({ message }) => {
      notify(message, true);
      router.push("/");
      setTimeout(() => {
        resetSession();
      }, 1000);
    });
  };

  const avatar = (
    <Avatar
      sx={(theme) => ({
        width: 36,
        height: 36,
        fontSize: "0.875rem",
        fontWeight: 600,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
      })}
    >
      {initials}
    </Avatar>
  );

  const logoutSx = (theme: Theme) => ({
    transition: theme.transitions.create(["background-color", "color"], {
      duration: 150,
    }),
    "&:hover": {
      color: theme.palette.error.main,
      backgroundColor: alpha(theme.palette.error.main, 0.08),
      "& .MuiListItemIcon-root": { color: theme.palette.error.main },
    },
    "&.Mui-focusVisible": {
      outline: `2px solid ${theme.palette.error.main}`,
      outlineOffset: -2,
    },
  });

  if (!expanded) {
    return (
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          py: 1.5,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Tooltip title={`${displayName} · ${roleLabel}`} placement="right">
          {avatar}
        </Tooltip>
        <Tooltip title="Salir" placement="right">
          <IconButton
            aria-label="Salir"
            onClick={logout}
            sx={(theme) => ({
              width: 44,
              height: 44,
              color: theme.palette.text.secondary,
              ...logoutSx(theme),
            })}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexShrink: 0,
        p: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.25,
          borderRadius: "12px",
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        })}
      >
        {avatar}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Tooltip title={displayName} placement="top">
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {displayName}
            </Typography>
          </Tooltip>
          <Typography
            variant="caption"
            noWrap
            component="div"
            sx={{ color: "text.secondary" }}
          >
            {roleLabel}
          </Typography>
        </Box>
      </Box>
      <ListItemButton
        onClick={logout}
        sx={(theme) => ({
          mt: 1,
          minHeight: 44,
          px: 1.5,
          borderRadius: "10px",
          color: theme.palette.text.primary,
          "& .MuiListItemIcon-root": {
            minWidth: 36,
            color: theme.palette.text.secondary,
            transition: theme.transitions.create("color", { duration: 150 }),
          },
          "& .MuiListItemText-primary": { fontSize: "0.875rem" },
          ...logoutSx(theme),
        })}
      >
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Salir" />
      </ListItemButton>
    </Box>
  );
};
