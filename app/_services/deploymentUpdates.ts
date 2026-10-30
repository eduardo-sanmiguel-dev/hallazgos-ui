/** Una conexión por pestaña. Solo reintenta si se corta: no consulta versiones. */
export function connectDeploymentUpdates(
  url: string,
  currentVersion: string,
  onUpdate: (version: string) => boolean | Promise<boolean>,
) {
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let updating = false;
  let checking = false;
  let pendingVersion: string | undefined;
  let attempts = 0;

  async function handleVersion(version: string) {
    pendingVersion = version;
    if (checking || updating || stopped) return;
    checking = true;
    try {
      while (pendingVersion && !stopped && !updating) {
        const next = pendingVersion;
        pendingVersion = undefined;
        try {
          updating = await onUpdate(next);
        } catch {
          updating = false;
        }
      }
    } finally {
      checking = false;
    }
  }

  function scheduleReconnect() {
    if (stopped || updating || retry) return;
    const delay = Math.min(1_000 * 2 ** Math.min(attempts++, 5), 30_000);
    retry = setTimeout(() => {
      retry = undefined;
      connect();
    }, delay + Math.random() * 1_000);
  }

  function connect() {
    if (stopped || updating) return;
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    socket.onopen = () => { attempts = 0; };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (
          message?.type === "ui-version" &&
          typeof message.version === "string" &&
          message.version.length > 0 &&
          message.version !== currentVersion &&
          !updating && !stopped
        ) {
          void handleVersion(message.version);
        }
      } catch {
        // Un mensaje inválido no debe romper la aplicación.
      }
    };
    socket.onclose = scheduleReconnect;
    socket.onerror = () => socket?.close();
  }

  // Al volver de suspensión o recuperar Internet se abre una conexión nueva,
  // que recibe la versión vigente aunque se haya perdido el aviso del deploy.
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
