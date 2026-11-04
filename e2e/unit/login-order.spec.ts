import { expect, test } from "vite-plus/test";
import type { Page, Response } from "@playwright/test";
import { loginWithForm } from "../support/login";

test("el timeout del login empieza después de cargar y llenar el formulario, antes del clic", async () => {
  const steps: string[] = [];
  const response = { status: () => 200 } as Response;
  let complete!: (response: Response) => void;
  const page = {
    goto: async () => {
      steps.push("load");
    },
    getByLabel: (label: string) => ({
      fill: async () => {
        steps.push(label);
      },
    }),
    waitForResponse: () => {
      steps.push("listen");
      return new Promise<Response>((resolve) => {
        complete = resolve;
      });
    },
    getByRole: () => ({
      click: async () => {
        steps.push("click");
        complete(response);
      },
    }),
  } as unknown as Page;
  expect(await loginWithForm(page, "user@example.test", "test-password")).toBe(response);
  expect(steps).toEqual(["load", "Correo Electrónico", "Contraseña", "listen", "click"]);
});
