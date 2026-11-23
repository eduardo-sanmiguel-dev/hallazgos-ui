import { describe, expect, test } from "vite-plus/test";

import { heatmapPlanAlt, selectorPlanAlt } from "../../app/features/areas/_lib/planAlt";
import { qrAlt } from "../../app/features/emergency-teams/_components/qrPrint";
import { evidencePhotoAlt } from "../../app/features/hallazgos/_constants/evidencePhotoAlt";

describe("Texto alternativo de las fotos de un hallazgo", () => {
  const evidence = {
    id: 42,
    zone: { name: "Almacén", area: { name: "Producción" } },
    mainType: { name: "Condición insegura" },
    secondaryType: { name: "Orden y limpieza" },
    description: "  Derrame de aceite\njunto al montacargas ",
    descriptionSolution: "Se limpió y se puso charola",
  };

  test("la foto del hallazgo dice qué, dónde y lo que se observó", () => {
    expect(evidencePhotoAlt("evidence", evidence)).toBe(
      "Foto del hallazgo #42 (Condición insegura · Orden y limpieza) en Producción, Almacén: Derrame de aceite junto al montacargas",
    );
  });

  test("la de la solución lleva la descripción de la solución; la del progreso, ninguna", () => {
    expect(evidencePhotoAlt("solution", evidence)).toMatch(
      /^Foto de la solución #42 .*: Se limpió y se puso charola$/,
    );
    expect(evidencePhotoAlt("process", evidence)).toBe(
      "Foto del progreso #42 (Condición insegura · Orden y limpieza) en Producción, Almacén",
    );
  });

  test("sin área ni descripción no deja huecos", () => {
    expect(
      evidencePhotoAlt("evidence", {
        ...evidence,
        zone: { name: "Patio", area: null },
        description: " ",
      }),
    ).toBe("Foto del hallazgo #42 (Condición insegura · Orden y limpieza) en Patio");
  });

  test("una descripción larga se recorta (completa está junto a la foto)", () => {
    const alt = evidencePhotoAlt("evidence", { ...evidence, description: "a".repeat(500) });
    const text = alt.split(": ")[1];
    expect(text).toHaveLength(120);
    expect(text.endsWith("…")).toBe(true);
  });
});

describe("Texto alternativo del plano", () => {
  const point = (areaName: string, Abierto: number) => ({ areaName, statusCounts: { Abierto } });

  test("selector: dice si la zona ya tiene ubicación", () => {
    expect(selectorPlanAlt(true)).toBe("Plano de la planta con la ubicación de la zona marcada");
    expect(selectorPlanAlt(false)).toMatch(/sin ubicación marcada/);
  });

  test("mapa de calor: resume las zonas con más hallazgos abiertos", () => {
    expect(
      heatmapPlanAlt([
        point("Patio", 2),
        point("Almacén", 5),
        point("Patio", 4), // dos puntos de la misma zona se suman
        point("Oficinas", 0), // sin abiertos no cuenta
      ]),
    ).toBe(
      "Mapa de calor de hallazgos abiertos sobre el plano de la planta, en 2 zonas. " +
        "Con más hallazgos: Patio (6 hallazgos), Almacén (5 hallazgos).",
    );
  });

  test("mapa de calor: nombra 5 zonas y cuenta el resto", () => {
    const alt = heatmapPlanAlt(
      ["A", "B", "C", "D", "E", "F", "G"].map((name, i) => point(name, 10 - i)),
    );
    expect(alt).toContain("en 7 zonas");
    expect(alt).toContain("E (6 hallazgos)");
    expect(alt).not.toContain("F (");
    expect(alt.endsWith("y 2 zonas más.")).toBe(true);
  });

  test("mapa de calor: una sola zona y sin datos", () => {
    expect(heatmapPlanAlt([point("Patio", 1)])).toBe(
      "Mapa de calor de hallazgos abiertos sobre el plano de la planta, en 1 zona. Zona: Patio (1 hallazgo).",
    );
    expect(heatmapPlanAlt([])).toBe("Plano de la planta: no hay hallazgos abiertos con ubicación");
  });
});

describe("Texto alternativo del QR de un equipo de emergencia", () => {
  test("dice el número de extintor y dónde está", () => {
    expect(qrAlt({ id: 7, extinguisherNumber: "EXT-12", location: " Pasillo 3 " })).toBe(
      "Código QR del extintor EXT-12, en Pasillo 3",
    );
  });

  test("sin número usa el id; sin ubicación la omite", () => {
    expect(qrAlt({ id: 7, extinguisherNumber: "", location: "" })).toBe(
      "Código QR del equipo de emergencia 7",
    );
  });
});
