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
    let active = true;

    const disconnect = connectDeploymentUpdates(url.href, version, async (publishedVersion, target) => {
      // Confirmar que la UI responde también cuando se despliega solo la API.
      // En un deploy de UI, además debe estar sirviendo el build anunciado.
      const response = await fetch("/api/deployment-version", {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!active || !response.ok) return false;
      if (target === "ui" && (await response.json()).version !== publishedVersion) {
        return false;
      }
      if (!active) return false;
      window.location.reload();
      return true;
    });

    return () => {
      active = false;
      disconnect();
    };
  }, []);

  return null;
}
