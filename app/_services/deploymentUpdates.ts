type DeploymentTarget = "ui" | "api";

/** Una conexión por pestaña. Solo reintenta si se corta: no consulta versiones. */
export function connectDeploymentUpdates(
  url: string,
  currentVersion: string,
  onUpdate: (version: string, target: DeploymentTarget) => boolean | Promise<boolean>,
) {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let updating = false;
  let checking = false;
  const pendingVersions = new Map<DeploymentTarget, string>();
  let attempts = 0;
  // sessionStorage conserva la versión por pestaña incluso tras una recarga.
  // Si el navegador bloquea el almacenamiento, se conserva solo en memoria.
  const apiVersionKey = `deployment-api-version:${url}`;
  let apiVersion: string | undefined;
  try {
    apiVersion = window.sessionStorage.getItem(apiVersionKey) ?? undefined;
  } catch {
    // Por ejemplo, almacenamiento deshabilitado por el navegador.
  }

  function rememberApiVersion(version: string) {
    apiVersion = version;
    try {
      window.sessionStorage.setItem(apiVersionKey, version);
    } catch {
      // La reconexión también funciona con la referencia en memoria.
    }
  }

  async function handleVersion(version: string, target: DeploymentTarget) {
    pendingVersions.set(target, version);
    if (checking || updating || stopped) return;
    checking = true;
    try {
      while (pendingVersions.size && !stopped && !updating) {
        const [nextTarget, nextVersion] = pendingVersions.entries().next().value!;
        pendingVersions.delete(nextTarget);
        const previousApiVersion = apiVersion;
        if (nextTarget === "api") {
          if (nextVersion === apiVersion) continue;
          // Guardar antes de recargar evita repetir la recarga al reconectar.
          rememberApiVersion(nextVersion);
        }
        try {
          updating = await onUpdate(nextVersion, nextTarget);
        } catch {
          updating = false;
        }
        if (!updating && nextTarget === "api" && previousApiVersion) {
          // Si la UI todavía no está disponible, reintentar en la reconexión.
          rememberApiVersion(previousApiVersion);
        }
      }
    } finally {
      checking = false;
    }
  }

  function scheduleReconnect() {
    if (stopped || updating || retry) return;
    const delay = Math.min(1_000 * 2 ** Math.min(attempts++, 5), 30_000);
    retry = setTimeout(
      () => {
        retry = undefined;
        connect();
      },
      delay + Math.random() * 1_000,
    );
  }

  function connect() {
    if (stopped || updating) return;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    const connection = socket;
    connection.onopen = () => {
      attempts = 0;
    };
    connection.onmessage = (event) => {
      if (stopped || updating || socket !== connection) return;
      try {
        const message = JSON.parse(event.data);
        if (typeof message?.version !== "string" || !message.version.length) return;
        if (message.type === "ui-version" && message.version !== currentVersion) {
          void handleVersion(message.version, "ui");
        } else if (message.type === "api-version") {
          if (!apiVersion) rememberApiVersion(message.version);
          else if (message.version !== apiVersion) {
            void handleVersion(message.version, "api");
          }
        }
      } catch {
        // Un mensaje inválido no debe romper la aplicación.
      }
    };
    connection.onclose = scheduleReconnect;
    connection.onerror = () => connection.close();
  }

  // Una conexión nueva recibe ambas versiones, incluso tras perder un deploy.
  function resume() {
    if (stopped || updating || document.visibilityState === "hidden") return;
    if (retry) clearTimeout(retry);
    retry = undefined;
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    connect();
  }

  connect();
  window.addEventListener("online", resume);
  window.addEventListener("pageshow", resume);
  document.addEventListener("visibilitychange", resume);

  return () => {
    stopped = true;
    if (retry) clearTimeout(retry);
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    window.removeEventListener("online", resume);
    window.removeEventListener("pageshow", resume);
    document.removeEventListener("visibilitychange", resume);
  };
}
