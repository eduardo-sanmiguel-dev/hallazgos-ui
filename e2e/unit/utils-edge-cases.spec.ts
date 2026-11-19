import { AxiosError } from "axios";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import { parseApiError } from "../../app/_services/apiError";
import { catalogKeys } from "../../app/_shared/libs/catalogKeys";
import { dataURLtoFile } from "../../app/_shared/utils";
import { safeNextPath } from "../../app/_shared/utils/nextPath";
import { periodLabel } from "../../app/_shared/utils/period";
import { isBotNavigator } from "../../app/_shared/utils/rum";
import { mutationAction, rumModule } from "../../app/_shared/utils/rumActionNames";
import { parseSavedSort } from "../../app/_shared/utils/tableSort";
import { topWithOthers } from "../../app/features/business-intelligence/epp/_lib/biEpp";
import { parseColor } from "../../app/features/dashboard/_lib/pdfColors";
import { evidenceActionsFor } from "../../app/features/hallazgos/_constants/evidenceActions";
import type { EvidenceRow } from "../../app/_interfaces";

// Casos de borde de utilidades pequeñas que no tienen su propio spec o que
// no encajan en el suyo.

afterEach(() => vi.unstubAllGlobals());

test("safeNextPath descarta una ruta que el navegador no puede interpretar", () => {
  // Las tabulaciones se ignoran: queda "//[" (un host inválido).
  expect(safeNextPath("/\t/[")).toBeNull();
});

test("rumModule nombra la sección de Inteligencia de negocio / EPP", () => {
  expect(rumModule("/business-intelligence/epp")).toBe("Inteligencia de negocio / EPP");
});

test("parseSavedSort ignora un orden guardado que no es JSON", () => {
  expect(parseSavedSort("{no es json", [{ key: "name", label: "Nombre", kind: "text" }])).toBe(
    null,
  );
});

test("parseColor acepta hexadecimales cortos (#rgb)", () => {
  expect(parseColor("#0f8")).toEqual([0, 255, 136]);
});

test("topWithOthers deja los mayores y suma el resto en Otros", () => {
  expect(topWithOthers([3, 10, 1, 7], 2, (value) => value)).toEqual({
    top: [10, 7],
    othersTotal: 4,
    othersCount: 2,
  });
});

test("isBotNavigator detecta Chrome headless por sus brands", () => {
  const nav = { userAgent: "Mozilla/5.0 Chrome/140", webdriver: false };
  expect(isBotNavigator({ ...nav, userAgentData: { brands: [{ brand: "HeadlessChrome" }] } })).toBe(
    true,
  );
  expect(isBotNavigator({ ...nav, userAgentData: { brands: [{ brand: "Google Chrome" }] } })).toBe(
    false,
  );
});

test("dataURLtoFile convierte la foto capturada en archivo con su tipo", async () => {
  const file = dataURLtoFile(`data:image/png;base64,${btoa("hola")}`, "foto.png");

  expect(file.name).toBe("foto.png");
  expect(file.type).toBe("image/png");
  expect(await file.text()).toBe("hola");
});

test("periodLabel de un año a otro escribe ambas fechas completas", () => {
  expect(periodLabel({ desde: "2025-12-01", hasta: "2026-01-22" })).toBe(
    "1 dic 2025 – 22 ene 2026",
  );
});

test("catalogKeys de usuarios y colaboradores sin filtros usan un objeto vacío", () => {
  expect(catalogKeys.users()).toEqual(["catalogs", "users", {}]);
  expect(catalogKeys.employees()).toEqual(["catalogs", "employees", {}]);
});

test("un supervisor que es responsable (no supervisor) del hallazgo también puede actuar", () => {
  const actions = evidenceActionsFor({
    userId: 20,
    role: "Supervisor",
    evidencePermissions: { supervisorOverride: false, cancelEvidence: false },
  });
  const row = {
    id: 1,
    status: "Abierto",
    imgProcess: "",
    supervisors: [{ id: 10 }],
    responsibles: [{ id: 20 }],
  } as unknown as EvidenceRow;

  expect(actions.canStart(row)).toBe(true);
});

describe("parseApiError sin respuesta del servidor", () => {
  const timeout = new AxiosError("timeout", AxiosError.ECONNABORTED);

  test("un tiempo de espera agotado con conexión es 'timeout'", () => {
    vi.stubGlobal("navigator", { onLine: true });
    expect(parseApiError(timeout).kind).toBe("timeout");
  });

  test("sin conexión, el mismo error se muestra como 'offline'", () => {
    vi.stubGlobal("navigator", { onLine: false });
    expect(parseApiError(timeout).kind).toBe("offline");
  });
});

test("mutationAction: eliminar un hallazgo es cancelarlo", () => {
  expect(mutationAction("/evidences", "/42", "DELETE")).toEqual({
    module: "Hallazgos",
    operation: "Cancelar hallazgo",
  });
});

describe("parseApiError sin código: tipo por estatus", () => {
  const withStatus = (status: number) =>
    Object.assign(new AxiosError("x"), { response: { status, data: {} } });

  test.each([
    [429, "rateLimit"],
    [502, "server"],
    [418, "unknown"],
  ])("%i es %s", (status, kind) => {
    expect(parseApiError(withStatus(status)).kind).toBe(kind);
  });
});
