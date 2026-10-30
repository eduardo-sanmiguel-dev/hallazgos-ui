"use client";

import { useEffect } from "react";

import { connectDeploymentUpdates } from "@services/deploymentUpdates";

export default function DeploymentUpdates() {
  useEffect(() => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION;
    const apiUrl = process.env.NEXT_PUBLIC_URL_API;
    if (!version || !apiUrl) return;

    const url = new URL(`${apiUrl.replace(/\/$/, "")}/deployments/ws`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

    return connectDeploymentUpdates(url.href, version, async (publishedVersion) => {
      // Durante el arranque de B, la API puede anunciar A hasta que el script
      // termine el health check. Confirmar la UI servida evita recargas en bucle.
      const response = await fetch("/api/deployment-version", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok || (await response.json()).version !== publishedVersion) {
        return false;
      }
      window.location.reload();
      return true;
    });
  }, []);

  return null;
}
