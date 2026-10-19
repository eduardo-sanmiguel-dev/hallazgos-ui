"use client";

import { useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";

import { reactPlugin } from "@datadog/browser-rum-react";

const DatadogRumInit = () => {
  useEffect(() => {
    if (datadogRum.getInitConfiguration?.()) {
      return;
    }

    datadogRum.init({
      applicationId: "3b824bc8-5c93-46b9-8812-c45b388f9be9",
      clientToken: "pub60adb2cb0c83205176393ba230c09ddb",
      site: "us5.datadoghq.com",
      service: process.env.NEXT_PUBLIC_DD_SERVICE || "hallazgos-ui",
      env: process.env.NEXT_PUBLIC_DD_ENV || "production",
      version: process.env.NEXT_PUBLIC_DD_VERSION || "1.0.0",
      sessionSampleRate: 100,
      sessionReplaySampleRate: 20,
      trackResources: true,
      trackUserInteractions: true,
      trackLongTasks: true,
      plugins: [reactPlugin({ router: false })],
    });
  }, []);

  return null;
};

export default DatadogRumInit;
