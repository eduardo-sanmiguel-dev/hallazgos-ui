"use client";

import {
  Fragment,
  MouseEvent,
  ReactNode,
  useRef,
  useState,
} from "react";

import { usePathname, useRouter } from "next/navigation";

import { Box } from "@mui/material";
import { Collapse } from "@mui/material";
import { Divider } from "@mui/material";
import { List } from "@mui/material";
import { ListItemButton } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListSubheader } from "@mui/material";
import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import FactoryIcon from "@mui/icons-material/Factory";
import RuleIcon from "@mui/icons-material/Rule";
import CategoryIcon from "@mui/icons-material/Category";
import PlaceIcon from "@mui/icons-material/Place";
import SchemaIcon from "@mui/icons-material/Schema";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ExpandMore from "@mui/icons-material/ExpandMore";
import BadgeIcon from "@mui/icons-material/Badge";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import MapIcon from "@mui/icons-material/Map";
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
import RouteIcon from "@mui/icons-material/Route";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

import { useUserSessionStore } from "@store";
import { ROLE_ADMINISTRADOR } from "@shared/constants";
import { primaryTextColor } from "../../theme";
import { useGembaWalkAccess } from "@hooks/useGembaWalkAccess";

// Usuarios que solo usan EPP: ven EPP e inspección de extintores, pero no
// HDS.
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

const notEppUser = ({ email }: MenuContext) => !EPP_USER_EMAILS.includes(email);

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
      visible: adminOnly,
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

const sectionsFor = (email: string) =>
  email === HDS_ONLY_EMAIL ? HDS_ONLY_SECTIONS : MENU_SECTIONS;

const flattenLinks = (sections: MenuSection[]) =>
  sections.flatMap((section) =>
    section.entries.flatMap((entry) => (isGroup(entry) ? entry.items : [entry])),
  );

const ALL_LINKS = flattenLinks(MENU_SECTIONS);

// `/epp` es dueño de `/epp` y `/epp/...`, no de `/eppx`.
const ownsPath = (url: string, pathname: string) =>
  pathname === url || pathname.startsWith(`${url}/`);

export type RouteAccessContext = MenuContext;

// La opción del menú que contiene la ruta: la de URL más larga que sea su
// prefijo (`/gemba-walk/zones/form` → "Zonas" de Gemba Walk, no "Gemba Walk").
const menuOwnerOf = (pathname: string) =>
  ALL_LINKS.filter((link) => ownsPath(link.url, pathname)).sort(
    (a, b) => b.url.length - a.url.length,
  )[0];

export interface BreadcrumbTrail {
  // Sección y subgrupo del menú (texto: no tienen página).
  parents: string[];
  // La lista a la que pertenece la página.
  list: { title: string; url: string };
}

// Ruta de una página interna (formulario o detalle) según el menú (B2):
// sección › subgrupo › lista. El subgrupo se omite si es "General" o si se
// llama igual que la lista (Criterios › Criterios). Sin ruta (null) en las
// listas mismas y en páginas que no están en el menú.
export const breadcrumbTrail = (pathname: string): BreadcrumbTrail | null => {
  const owner = menuOwnerOf(pathname);
  if (!owner || owner.url === pathname) return null;

  for (const section of MENU_SECTIONS) {
    for (const entry of section.entries) {
      const group = isGroup(entry) ? entry : null;
      const links = group ? group.items : [entry as MenuLinkConfig];
      if (!links.includes(owner)) continue;

      const parents = [
        section.title,
        group && group.title !== "General" && group.title !== owner.title
          ? group.title
          : undefined,
      ].filter((title): title is string => !!title);
      return { parents, list: { title: owner.title, url: owner.url } };
    }
  }
  return null;
};

// Una página se puede ver si su opción del menú es visible para el usuario.
// Así la página y el menú nunca se contradicen. Las rutas que no están en el
// menú no se bloquean aquí. Es solo para la UI: el API valida cada petición.
export const canAccessPath = (pathname: string, ctx: RouteAccessContext) => {
  const owner = menuOwnerOf(pathname);
  if (!owner) return true;

  return flattenLinks(visibleSections(sectionsFor(ctx.email), ctx)).some(
    (link) => link.url === owner.url,
  );
};

// Primera página del menú que el usuario puede ver (inicio alternativo para
// quien no tiene acceso al dashboard).
export const firstAccessiblePath = (ctx: RouteAccessContext) =>
  flattenLinks(visibleSections(sectionsFor(ctx.email), ctx))[0]?.url ??
  "/dashboard";

const isLinkSelected = (link: MenuLinkConfig, pathname: string) =>
  link.isSelected ? link.isSelected(pathname) : pathname.startsWith(link.url);

// Color del item activo (contraste AA sobre el fondo translúcido).
const activeColor = primaryTextColor;

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
  // El módulo de recorridos se muestra a los observadores de Gemba Walk y al
  // administrador.
  const isGembaWalkObserver = useGembaWalkAccess();

  const role = useUserSessionStore((state) => state.role);
  const email = useUserSessionStore((state) => state.email);
  const pathname = usePathname();

  const isAdmin = role === ROLE_ADMINISTRADOR;

  const sections = visibleSections(sectionsFor(email), {
    isAdmin,
    email,
    isGembaWalkObserver,
  });

  // Grupo que contiene la ruta actual: se abre automáticamente.
  const activeGroupId =
    sections
      .flatMap((section) => section.entries)
      .filter(isGroup)
      .find((group) =>
        group.items.some((item) => isLinkSelected(item, pathname)),
      )?.id ?? null;

  // Acordeón: un solo grupo abierto a la vez.
  const [openGroupId, setOpenGroupId] = useState<string | null>(activeGroupId);
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
