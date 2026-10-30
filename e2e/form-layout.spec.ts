import { expect, test } from "./support/fixtures";
import { trackPageErrors } from "./support/ui";

// Formularios de Configuración con el diseño de Hallazgos, Gemba Walk e
// Inspección de extintores: secciones con título (regiones con nombre) y
// ancho máximo de 960 px, centrado en escritorio. Solo lectura de pantalla.

const FORMS: { path: string; sections: string[] }[] = [
  { path: "/users/form", sections: ["Datos de acceso", "Permisos"] },
  {
    path: "/employees/form",
    sections: ["Datos personales", "Datos laborales"],
  },
  {
    path: "/manufacturing-plants/form",
    sections: ["Datos de la planta", "Ubicación"],
  },
  { path: "/zones/form", sections: ["Datos del lugar"] },
  {
    path: "/areas/form",
    sections: ["Datos de la zona", "Ubicación en el plano"],
  },
  { path: "/processes/form", sections: ["Datos del proceso"] },
  { path: "/main-types/form", sections: ["Datos del criterio"] },
  { path: "/secondary-types/form", sections: ["Datos del tipo de criterio"] },
  {
    path: "/equipments/form",
    sections: ["Datos del equipo", "Entrega y costo"],
  },
  {
    path: "/emergency-teams/form",
    sections: ["Planta y lugar", "Extintor"],
  },
  { path: "/gemba-walk/zones/form", sections: ["Datos generales"] },
  {
    path: "/gemba-walk/observers/form",
    sections: ["Recorrido", "Observadores"],
  },
  {
    path: "/gemba-walk/evaluations/form",
    sections: ["Clasificación", "Qué se verifica"],
  },
];

const MAX_WIDTH = 960;

test.describe("Diseño de los formularios de Configuración", () => {
  for (const { path, sections } of FORMS) {
    test(`${path}: secciones con título y ancho máximo`, async ({ page }) => {
      const errors = trackPageErrors(page);
      await page.goto(path);

      for (const name of sections) {
        await expect(
          page.getByRole("region", { name, exact: true }),
        ).toBeVisible();
      }

      // La pantalla mide 1440 px: sin el máximo, la sección ocuparía todo
      // el ancho del contenido.
      const box = (await page
        .getByRole("region", { name: sections[0], exact: true })
        .boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(MAX_WIDTH);

      // Centrada: el título de la página empieza donde la sección.
      const heading = (await page
        .getByRole("heading", { level: 1 })
        .boundingBox())!;
      expect(Math.abs(heading.x - box.x)).toBeLessThan(2);

      expect(errors).toEqual([]);
    });
  }

  test("calendario: sección de programación y acciones al pie", async ({
    page,
  }) => {
    await page.goto("/gemba-walk/calendar/form");

    const section = page.getByRole("region", {
      name: "Programación",
      exact: true,
    });
    await expect(section).toBeVisible();
    await expect(section.getByText("Recorrido regular")).toBeVisible();

    // "Guardar" va debajo del calendario, como en los demás formularios.
    const save = (await page
      .getByRole("button", { name: "Guardar" })
      .boundingBox())!;
    const calendar = (await page.locator(".fc").boundingBox())!;
    expect(save.y).toBeGreaterThan(calendar.y + calendar.height);
  });
});
