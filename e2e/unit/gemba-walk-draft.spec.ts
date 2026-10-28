import { expect, test } from "@playwright/test";

import {
  blockedReason,
  initialAnswers,
} from "../../app/(routes)/gemba-walk/form/_lib/walkDraft";

// Borrador de un recorrido de Gemba Walk (G1): cuándo un recorrido iniciado
// y recuperado ya no se puede registrar. La tolerancia de 15 minutos no
// cuenta aquí: se validó al iniciar.

const NOW = new Date("2026-10-28T12:00:00");
const at = (iso: string) => new Date(iso).toISOString();

const fields = (overrides: object = {}) => ({
  gembaWalkCalendarId: "30",
  started: { startToken: "t", startedAt: at("2026-10-28T08:05:00") },
  event: { scheduledAt: at("2026-10-28T08:00:00"), label: "08:00 · Z1" },
  ...overrides,
});

test.describe("Borrador de Gemba Walk", () => {
  test("de hoy y aún disponible: se puede registrar aunque haya pasado la tolerancia", () => {
    // Programado a las 8:00, son las 12:00: la tolerancia terminó hace horas.
    expect(blockedReason(fields(), [30, 31], NOW)).toBeNull();
  });

  test("sin poder consultar los disponibles, decide el API al registrar", () => {
    expect(blockedReason(fields(), null, NOW)).toBeNull();
  });

  test("sin iniciar no hay nada que bloquear", () => {
    expect(blockedReason(fields({ started: null }), [], NOW)).toBeNull();
  });

  test("de otro día: solo se registran los del día", () => {
    expect(
      blockedReason(
        fields({
          started: { startToken: "t", startedAt: at("2026-10-27T08:05:00") },
          event: { scheduledAt: at("2026-10-27T08:00:00"), label: "08:00" },
        }),
        [],
        NOW,
      ),
    ).toBe(
      "Era un recorrido del 27/10/2026: solo se pueden registrar los recorridos del día.",
    );
  });

  test("comprobante de inicio con más de 24 horas: vencido", () => {
    expect(
      blockedReason(
        fields({
          started: { startToken: "t", startedAt: at("2026-10-27T11:00:00") },
          event: null,
        }),
        [30],
        NOW,
      ),
    ).toBe("El inicio del recorrido venció: vale 24 horas.");
  });

  test("ya no está entre los disponibles: lo registró otro observador o dispositivo", () => {
    expect(blockedReason(fields(), [31], NOW)).toBe(
      "Este recorrido ya se registró (desde otro dispositivo o por otro observador).",
    );
  });

  test("respuestas: lo recuperado gana; los conceptos nuevos inician en Cumple", () => {
    const evaluation = (id: number) => ({ id }) as never;

    expect(
      initialAnswers([evaluation(1), evaluation(2)], {
        1: { isCompliant: false, comments: "Sin lentes" },
        9: { isCompliant: false, comments: "Concepto eliminado" },
      }),
    ).toEqual({
      1: { isCompliant: false, comments: "Sin lentes" },
      2: { isCompliant: true, comments: "" },
    });
  });
});
