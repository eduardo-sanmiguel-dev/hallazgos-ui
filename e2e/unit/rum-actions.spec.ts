import { describe, expect, test, vi } from "vite-plus/test";
import {
  contextualActionName,
  mutationAction,
  rumModule,
} from "../../app/_shared/utils/rumActionNames";
import { shouldSendRumEvent } from "../../app/_shared/utils/rum";
import { trackSystemResult } from "../../app/_shared/utils/rumActions";

vi.mock("@openobserve/browser-rum", () => ({ openobserveRum: { addAction: vi.fn() } }));
import { openobserveRum } from "@openobserve/browser-rum";

describe("Nombres de acciones de RUM", () => {
  test("distingue firma y entrega, conservando el módulo de origen", () => {
    for (const label of ["Guardar firma", "Guardar entrega de EPP"]) {
      const event = {
        type: "action",
        action: { type: "click", target: { name: label } },
        view: { url: "https://comportarte.com/epp?employee=123" },
        context: { existing: true },
      };
      expect(shouldSendRumEvent(event)).toBe(true);
      expect(event.action.target.name).toBe(`EPP · ${label}`);
      expect(event.context).toEqual({ existing: true, ui_module: "EPP" });
    }
  });
  test("usa la vista del clic, aunque después se navegue a otro módulo", () => {
    expect(contextualActionName("Editar", "https://comportarte.com/employees?search=Nombre")).toBe(
      "Colaboradores · Editar",
    );
    expect(rumModule("/gemba-walk/calendar/form?id=22")).toBe("Gemba Walk / Calendario");
    expect(rumModule("/business-intelligence/epp")).toBe("Inteligencia de negocio / EPP");
  });
  test("no renombra eventos del sistema ni altera otros eventos", () => {
    const event = {
      type: "action",
      action: {
        type: "custom",
        target: { name: "EPP · Guardar entrega · Confirmado por servidor" },
      },
      view: { url: "/epp" },
    };
    const original = structuredClone(event);
    expect(shouldSendRumEvent(event)).toBe(true);
    expect(event).toEqual(original);
    expect(shouldSendRumEvent({ type: "resource", action: { target: { name: "recurso" } } })).toBe(
      true,
    );
  });
  test("los trazos de firma siguen excluidos de frustración", () => {
    expect(
      shouldSendRumEvent({
        type: "action",
        action: { type: "click", target: { name: "firma-trazo" } },
        view: { url: "/epp" },
      }),
    ).toBe(false);
  });
});

describe("Resultado del servidor separado del clic", () => {
  test.each([
    ["/epps", "", "post", "EPP", "Guardar entrega"],
    ["/epps", "/history/42", "delete", "EPP", "Eliminar entrega"],
    ["/evidences", "/solution/42", "post", "Hallazgos", "Guardar cierre del hallazgo"],
    ["/evidences", "/process/42", "post", "Hallazgos", "Guardar inicio de atención"],
    ["/evidences", "/reassign/42", "patch", "Hallazgos", "Guardar responsables"],
    ["/evidences", "/add/comment/42", "post", "Hallazgos", "Publicar comentario"],
    [
      "/catalogs",
      "/gemba-walk-zones/42/activate",
      "patch",
      "Gemba Walk / Zonas",
      "Reactivar registro",
    ],
    ["/users", "/42", "patch", "Usuarios", "Actualizar registro"],
  ])("%s %s tiene un nombre estable", (base, url, method, module, operation) => {
    expect(mutationAction(base, url, method)).toEqual({ module, operation });
  });
  test("no agrega eventos de sistema por consultas ni rutas desconocidas", () => {
    expect(mutationAction("/epps", "", "get")).toBeUndefined();
    expect(mutationAction("/unknown", "/42", "post")).toBeUndefined();
    expect(mutationAction("/auth", "/check-token-restore-password", "post")).toBeUndefined();
  });
  test("registra éxito, fallo y replay sin incluir cuerpos, nombres o IDs", () => {
    vi.mocked(openobserveRum.addAction).mockClear();
    trackSystemResult("/epps", "", "post", "success", 201, true);
    trackSystemResult("/evidences", "/solution/123", "post", "error", 500);
    expect(openobserveRum.addAction).toHaveBeenNthCalledWith(
      1,
      "EPP · Guardar entrega · Confirmado por servidor",
      {
        ui_module: "EPP",
        operation: "Guardar entrega",
        result: "success",
        http_status: 201,
        replayed: true,
      },
    );
    expect(openobserveRum.addAction).toHaveBeenNthCalledWith(
      2,
      "Hallazgos · Guardar cierre del hallazgo · Intento fallido",
      {
        ui_module: "Hallazgos",
        operation: "Guardar cierre del hallazgo",
        result: "error",
        http_status: 500,
        replayed: false,
      },
    );
  });
  test("un fallo de telemetría no interrumpe la operación del usuario", () => {
    vi.mocked(openobserveRum.addAction).mockImplementationOnce(() => {
      throw new Error("RUM unavailable");
    });
    expect(() => trackSystemResult("/epps", "", "post", "success", 201)).not.toThrow();
  });
});
