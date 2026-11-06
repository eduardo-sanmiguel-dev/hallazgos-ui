// Stable names: never include IDs, form values, people or query parameters.
const modules: Record<string, string> = {
  epp: "EPP",
  epps: "EPP",
  hallazgos: "Hallazgos",
  evidences: "Hallazgos",
  ciael: "CIAEL",
  ciaels: "CIAEL",
  ics: "ICS",
  dashboard: "Dashboard",
  "business-intelligence": "Inteligencia de negocio",
  "gemba-walk": "Gemba Walk",
  "extinguisher-inspection": "Inspecciones de extintores",
  "extinguisher-inspections": "Inspecciones de extintores",
  users: "Usuarios",
  employees: "Colaboradores",
  equipments: "Equipos de EPP",
  areas: "Lugares",
  zones: "Zonas",
  processes: "Procesos",
  "manufacturing-plants": "Plantas",
  "main-types": "Criterios",
  "secondary-types": "Tipos de criterio",
  "emergency-teams": "Equipos de emergencia",
  hds: "HDS",
  "safety-data-files": "HDS",
  auth: "Acceso",
  privacy: "Privacidad",
};
const gembaSections: Record<string, string> = {
  calendar: "Calendario",
  schedule: "Agenda",
  zones: "Zonas",
  observers: "Observadores",
  evaluations: "Conceptos",
};

export function rumModule(url: string) {
  const parts = new URL(url, "https://ui.invalid").pathname.split("/").filter(Boolean);
  const module = modules[parts[0]] ?? "Aplicación";
  if (parts[0] === "business-intelligence" && parts[1] === "epp")
    return "Inteligencia de negocio / EPP";
  const section = parts[0] === "gemba-walk" ? gembaSections[parts[1]] : undefined;
  return section ? `${module} / ${section}` : parts.length ? module : "Acceso";
}

export function contextualActionName(name: string, url: string) {
  return `${rumModule(url)} · ${name}`;
}

export function mutationAction(baseURL: string, url: string, method: string) {
  const verb = method.toLowerCase();
  if (!["post", "put", "patch", "delete"].includes(verb)) return undefined;
  if (baseURL === "/catalogs") {
    const catalog = /^\/([a-z-]+)\/\d+\/activate$/.exec(url)?.[1];
    if (!catalog) return undefined;
    const path = catalog.startsWith("gemba-walk-")
      ? catalog.replace("gemba-walk-", "gemba-walk/")
      : catalog;
    const module = rumModule(`/${path}`);
    return module === "Aplicación" ? undefined : { module, operation: "Reactivar registro" };
  }
  const module = rumModule(baseURL);
  if (module === "Aplicación") return undefined;
  let operation =
    verb === "post"
      ? "Crear registro"
      : verb === "delete"
        ? "Eliminar registro"
        : "Actualizar registro";
  if (baseURL === "/epps") operation = verb === "delete" ? "Eliminar entrega" : "Guardar entrega";
  if (baseURL === "/evidences") {
    if (/^\/solution\//.test(url)) operation = "Guardar cierre del hallazgo";
    else if (/^\/process\//.test(url)) operation = "Guardar inicio de atención";
    else if (/comment/.test(url)) operation = "Publicar comentario";
    else if (/^\/reassign\//.test(url)) operation = "Guardar responsables";
    else if (verb === "delete") operation = "Cancelar hallazgo";
  }
  if (baseURL === "/gemba-walk/walks" && url === "/start") operation = "Iniciar recorrido";
  if (baseURL === "/auth") {
    const operations: Record<string, string> = {
      "/login": "Iniciar sesión",
      "/logout": "Cerrar sesión",
      "/forgot-password": "Solicitar recuperación de contraseña",
      "/login-restore-password": "Restablecer contraseña",
    };
    operation = operations[url];
    if (!operation) return undefined;
  }
  return { module, operation };
}
