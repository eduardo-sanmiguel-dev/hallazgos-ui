"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { ListItemButton } from "@mui/material";
import { ListItemIcon } from "@mui/material";
import { ListItemText } from "@mui/material";
import { ListSubheader } from "@mui/material";
import { List } from "@mui/material";
import { Collapse } from "@mui/material";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import LogoutIcon from "@mui/icons-material/Logout";
import FactoryIcon from "@mui/icons-material/Factory";
import RuleIcon from "@mui/icons-material/Rule";
import CategoryIcon from "@mui/icons-material/Category";
import PlaceIcon from "@mui/icons-material/Place";
import SchemaIcon from "@mui/icons-material/Schema";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { Tooltip } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SchoolIcon from "@mui/icons-material/School";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BadgeIcon from "@mui/icons-material/Badge";
import FolderIcon from "@mui/icons-material/Folder";
import FireExtinguisherIcon from "@mui/icons-material/FireExtinguisher";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import MapIcon from "@mui/icons-material/Map";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import GridViewIcon from "@mui/icons-material/GridView";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FactCheckIcon from "@mui/icons-material/FactCheck";

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

const userEpp = ["malonso@hadainternational.com"];

function CreateLink({
  url,
  title,
  tooltip,
  icon,
  nested = false,
  level = 1,
  expanded = true,
  isSelected,
}: {
  url: string;
  title: string;
  tooltip?: string;
  icon: ReactNode;
  nested?: boolean;
  level?: number;
  expanded?: boolean;
  // Por defecto se marca cuando la ruta actual empieza con `url`.
  isSelected?: (pathname: string) => boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tooltip title={tooltip || title} placement="right">
      <ListItemButton
        onClick={() => router.push(url)}
        selected={isSelected ? isSelected(pathname) : pathname.startsWith(url)}
        sx={nested ? { pl: expanded ? 2 + level * 2 : 2 } : undefined}
      >
        <ListItemIcon>{icon}</ListItemIcon>
        {expanded && <ListItemText primary={title} />}
      </ListItemButton>
    </Tooltip>
  );
}

export const MainListItems = ({ expanded = true }: { expanded?: boolean }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openMedicinaLaboral, setOpenMedicinaLaboral] = useState(false);
  const [openGembaWalk, setOpenGembaWalk] = useState(false);
  const [isGembaWalkObserver, setIsGembaWalkObserver] = useState(false);

  const role = useUserSessionStore((state) => state.role);
  const email = useUserSessionStore((state) => state.email);

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

  // El módulo de recorridos solo se muestra a los observadores de Gemba Walk.
  useEffect(() => {
    GembaWalksService.access()
      .then(({ isObserver }) => setIsGembaWalkObserver(isObserver))
      .catch(() => setIsGembaWalkObserver(false));
  }, []);

  useEffect(() => {
    if (role && role === ROLE_ADMINISTRADOR && !isAdmin) {
      setIsAdmin(true);
    }
  }, [role, isAdmin]);

  if (email === "cosmeticostrujillo0023@gmail.com")
    return (
      <CreateLink
        url="/hds"
        title="HDS"
        icon={<FolderIcon />}
        expanded={expanded}
      />
    );

  return (
    <>
      <CreateLink
        url="/dashboard"
        title="Dashboard"
        icon={<SpaceDashboardIcon />}
        expanded={expanded}
      />
      <CreateLink
        url="/hallazgos"
        title="Hallazgos"
        icon={<AddPhotoAlternateIcon />}
        expanded={expanded}
      />
      {(isAdmin || userEpp.includes(email)) && (
        <>
          <CreateLink
            url="/epp"
            title="EPP"
            tooltip="Equipos de protección personal"
            icon={<HealthAndSafetyIcon />}
            expanded={expanded}
          />
          <CreateLink
            url="/extinguisher-inspection"
            title="Inspección de extintores"
            icon={<FireExtinguisherIcon />}
            expanded={expanded}
          />
        </>
      )}
      {isGembaWalkObserver ||
        (isAdmin && (
          <CreateLink
            url="/gemba-walk"
            title="Gemba Walk"
            tooltip="Gemba Walk - Recorridos"
            icon={<DirectionsWalkIcon />}
            expanded={expanded}
            isSelected={(pathname) =>
              pathname === "/gemba-walk" ||
              pathname.startsWith("/gemba-walk/form") ||
              pathname.startsWith("/gemba-walk/view") ||
              pathname.startsWith("/gemba-walk/schedule")
            }
          />
        ))}
      {!userEpp.includes(email) && (
        <>
          <CreateLink
            url="/training-guide"
            title="Guías de entrenamiento"
            icon={<SchoolIcon />}
            expanded={expanded}
          />
          <CreateLink
            url="/hds"
            title="HDS"
            tooltip="Hojas de datos de seguridad"
            icon={<FolderIcon />}
            expanded={expanded}
          />
        </>
      )}
      {isAdmin && (
        <>
          <Tooltip title="Medicina laboral" placement="right">
            <ListItemButton
              onClick={() => setOpenMedicinaLaboral((prev) => !prev)}
            >
              <ListItemIcon>
                <MedicalServicesIcon />
              </ListItemIcon>
              {expanded && <ListItemText primary="Medicina laboral" />}
              {expanded ? (
                openMedicinaLaboral ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )
              ) : (
                <ChevronRightIcon
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                    transform: openMedicinaLaboral
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
          <Collapse in={openMedicinaLaboral} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <CreateLink
                nested
                url="/ics"
                title="ICS"
                tooltip="Índice de comportamiento seguro"
                icon={<QueryStatsIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/ciael"
                title="CIAEL"
                tooltip="Caracterización de incidentes, accidentes y enfermedades laborales"
                icon={<ReportProblemIcon />}
                expanded={expanded}
              />
            </List>
          </Collapse>

          <Tooltip title="Configuraciones" placement="right">
            <ListItemButton onClick={() => setOpenConfig((prev) => !prev)}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              {expanded && <ListItemText primary="Configuraciones" />}
              {expanded ? (
                openConfig ? (
                  <ExpandLess />
                ) : (
                  <ExpandMore />
                )
              ) : (
                <ChevronRightIcon
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                    transform: openConfig ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
          <Collapse in={openConfig} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <CreateLink
                nested
                url="/users"
                title="Usuarios"
                icon={<ManageAccountsIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/employees"
                title="Colaboradores"
                icon={<BadgeIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/manufacturing-plants"
                title="Plantas"
                icon={<FactoryIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/main-types"
                title="Criterios"
                icon={<RuleIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/secondary-types"
                title="Tipos de criterios"
                icon={<CategoryIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/zones"
                title="Lugares"
                icon={<PlaceIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/areas"
                title="Zonas"
                icon={<MapIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/processes"
                title="Procesos"
                icon={<SchemaIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/topics-tg"
                title="Temas - G. Entr."
                tooltip="Temas - Guías de entrenamiento"
                icon={<MenuBookIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/config-tg"
                title="Config - G. Entr."
                tooltip="Configuraciones - Guías de entrenamiento"
                icon={<SettingsSuggestIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/equipments"
                title="Equipo de protección"
                icon={<HealthAndSafetyIcon />}
                expanded={expanded}
              />
              <CreateLink
                nested
                url="/emergency-teams"
                title="Equipos de emergencia"
                icon={<FireExtinguisherIcon />}
                expanded={expanded}
              />
              <Tooltip title="Gemba Walk" placement="right">
                <ListItemButton
                  onClick={() => setOpenGembaWalk((prev) => !prev)}
                  sx={{ pl: expanded ? 4 : 2 }}
                >
                  <ListItemIcon>
                    <DirectionsWalkIcon />
                  </ListItemIcon>
                  {expanded && <ListItemText primary="Gemba Walk" />}
                  {expanded ? (
                    openGembaWalk ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )
                  ) : (
                    <ChevronRightIcon
                      sx={{
                        fontSize: 18,
                        color: "text.secondary",
                        transform: openGembaWalk
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
              <Collapse in={openGembaWalk} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <CreateLink
                    nested
                    level={2}
                    url="/gemba-walk/zones"
                    title="Zonas"
                    tooltip="Gemba Walk - Zonas"
                    icon={<GridViewIcon />}
                    expanded={expanded}
                  />
                  <CreateLink
                    nested
                    level={2}
                    url="/gemba-walk/observers"
                    title="Observadores"
                    tooltip="Gemba Walk - Observadores"
                    icon={<VisibilityIcon />}
                    expanded={expanded}
                  />
                  <CreateLink
                    nested
                    level={2}
                    url="/gemba-walk/calendar"
                    title="Calendario"
                    tooltip="Gemba Walk - Calendario"
                    icon={<CalendarMonthIcon />}
                    expanded={expanded}
                  />
                  <CreateLink
                    nested
                    level={2}
                    url="/gemba-walk/evaluations"
                    title="Evaluaciones"
                    tooltip="Gemba Walk - Conceptos de evaluación"
                    icon={<FactCheckIcon />}
                    expanded={expanded}
                  />
                </List>
              </Collapse>
            </List>
          </Collapse>
        </>
      )}
    </>
  );
};

export const SecondaryListItems = ({
  expanded = true,
}: {
  expanded?: boolean;
}) => {
  const router = useRouter();
  const { resetSession } = useUserSessionStore();

  return (
    <>
      {expanded && (
        <ListSubheader component="div" inset>
          Análisis de datos
        </ListSubheader>
      )}
      <CreateLink
        url="/business-intelligence/epp"
        title="Epp"
        tooltip="Equipos de protección personal"
        icon={<InsightsIcon />}
        expanded={expanded}
      />
      <ListItemButton
        onClick={() => {
          AuthService.logout().then(({ message }) => {
            notify(message, true);
            router.push("/");
            setTimeout(() => {
              resetSession();
            }, 1000);
          });
        }}
      >
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        {expanded && <ListItemText primary="Salir" />}
      </ListItemButton>
    </>
  );
};
