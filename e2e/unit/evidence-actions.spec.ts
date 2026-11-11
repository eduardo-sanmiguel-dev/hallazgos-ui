import { describe, expect, test } from "vite-plus/test";

import { evidenceActionsFor } from "../../app/features/hallazgos/_constants/evidenceActions";
import type { EvidenceRow } from "../../app/_interfaces";

// Acciones del menú de cada hallazgo. Los permisos especiales llegan
// calculados en la sesión (evidencePermissions); antes se comparaba el correo
// con listas que el API enviaba completas a cualquier usuario.

const row = (overrides: Partial<EvidenceRow> = {}) =>
  ({
    id: 1,
    status: "Abierto",
    imgProcess: "",
    supervisors: [{ id: 10 }],
    responsibles: [{ id: 20 }],
    ...overrides,
  }) as unknown as EvidenceRow;

const NONE = { supervisorOverride: false, cancelEvidence: false };

describe("evidenceActionsFor", () => {
  test("supervisor asignado: inicia, cierra y reasigna; no cancela", () => {
    const actions = evidenceActionsFor({
      userId: 10,
      role: "Supervisor",
      evidencePermissions: NONE,
    });
    expect(actions.canStart(row())).toBe(true);
    expect(actions.canClose(row())).toBe(true);
    expect(actions.canReassign(row())).toBe(true);
    expect(actions.canCancel(row())).toBe(false);
  });

  test("usuario sin asignación ni permisos: ninguna acción", () => {
    const actions = evidenceActionsFor({ userId: 99, role: "General", evidencePermissions: NONE });
    expect(actions.canStart(row())).toBe(false);
    expect(actions.canClose(row())).toBe(false);
    expect(actions.canReassign(row())).toBe(false);
    expect(actions.canCancel(row())).toBe(false);
  });

  test("supervisor especial (supervisorOverride): actúa en cualquier hallazgo", () => {
    const actions = evidenceActionsFor({
      userId: 99,
      role: "General",
      evidencePermissions: { supervisorOverride: true, cancelEvidence: false },
    });
    expect(actions.canStart(row())).toBe(true);
    expect(actions.canClose(row({ status: "En progreso" }))).toBe(true);
    expect(actions.canReassign(row())).toBe(true);
    expect(actions.canCancel(row())).toBe(false);
  });

  test("cancelEvidence permite cancelar sin ser administrador", () => {
    const actions = evidenceActionsFor({
      userId: 99,
      role: "General",
      evidencePermissions: { supervisorOverride: false, cancelEvidence: true },
    });
    expect(actions.canCancel(row())).toBe(true);
    expect(actions.canClose(row())).toBe(false);
  });

  test("administrador: inicia, reasigna y cancela, pero no cierra", () => {
    const actions = evidenceActionsFor({
      userId: 99,
      role: "Administrador",
      evidencePermissions: NONE,
    });
    expect(actions.canStart(row())).toBe(true);
    expect(actions.canReassign(row())).toBe(true);
    expect(actions.canCancel(row())).toBe(true);
    expect(actions.canClose(row())).toBe(false);
  });

  test("Cerrado y Cancelado son finales para todos", () => {
    const actions = evidenceActionsFor({
      userId: 10,
      role: "Administrador",
      evidencePermissions: { supervisorOverride: true, cancelEvidence: true },
    });
    for (const status of ["Cerrado", "Cancelado"]) {
      expect(actions.canStart(row({ status }))).toBe(false);
      expect(actions.canClose(row({ status }))).toBe(false);
      expect(actions.canReassign(row({ status }))).toBe(false);
      expect(actions.canCancel(row({ status }))).toBe(false);
    }
  });

  test("ya iniciado (con foto de avance) no se vuelve a iniciar", () => {
    const actions = evidenceActionsFor({
      userId: 10,
      role: "Supervisor",
      evidencePermissions: NONE,
    });
    expect(actions.canStart(row({ status: "En progreso", imgProcess: "x.png" }))).toBe(false);
  });

  test("sin evidencePermissions (API anterior): sin permisos especiales", () => {
    const actions = evidenceActionsFor({ userId: 99, role: "General" });
    expect(actions.canClose(row())).toBe(false);
    expect(actions.canCancel(row())).toBe(false);
  });
});
