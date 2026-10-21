import type { Page } from "@playwright/test";

import { captureWrites, mockGet } from "./support/api";
import { expect, test } from "./support/fixtures";
import { pickOption, toast, trackPageErrors } from "./support/ui";

// Acciones sobre hallazgos de la tabla: detalle, comentarios, en progreso,
// cierre, reasignación y cancelación. La lista viene de GraphQL con datos
// fijos (un hallazgo por estado); las escrituras se interceptan.

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const SUPERVISOR = { id: 7001, name: "E2E Supervisor" };
const OTHER = { id: 7002, name: "E2E Responsable" };
const PLANT = { id: 1, name: "Planta E2E" };

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();

const evidence = (id: number, overrides: Record<string, unknown>) => ({
  __typename: "Evidence",
  id,
  status: "Abierto",
  priorityDays: 3,
  createdAt: daysAgo(10),
  updatedAt: daysAgo(1),
  solutionDate: null,
  startProcessDate: null,
  imgEvidence: "e2e-evidence.png",
  imgProcess: "",
  imgSolution: "",
  description: "E2E descripción del hallazgo",
  descriptionSolution: "",
  manufacturingPlant: { __typename: "ManufacturingPlant", ...PLANT },
  user: { __typename: "User", name: "E2E Autor" },
  mainType: { __typename: "MainType", name: "Condición insegura" },
  secondaryType: { __typename: "SecondaryType", name: "E2E Tipo" },
  supervisors: [{ __typename: "User", ...SUPERVISOR }],
  responsibles: [],
  zone: {
    __typename: "Zone",
    name: "E2E Lugar",
    area: { __typename: "Area", name: "E2E Zona" },
  },
  process: { __typename: "Process", name: "E2E Proceso" },
  comments: [
    {
      __typename: "Comment",
      id: 1,
      comment: "E2E comentario previo",
      user: { __typename: "User", name: "E2E Autor" },
      createdAt: daysAgo(2),
    },
  ],
  ...overrides,
});

const EVIDENCES = [
  // Abierto, vencido, comportamiento inseguro, sin responsables asignados.
  evidence(9001, {
    mainType: { __typename: "MainType", name: "Comportamiento inseguro" },
  }),
  // En progreso, a tiempo, con responsable.
  evidence(9002, {
    status: "En progreso",
    priorityDays: 30,
    createdAt: daysAgo(2),
    startProcessDate: daysAgo(1),
    imgProcess: "e2e-process.png",
    responsibles: [{ __typename: "User", ...OTHER }],
    process: null,
  }),
  // Cerrado a tiempo, con imágenes de las tres etapas.
  evidence(9003, {
    status: "Cerrado",
    priorityDays: 7,
    createdAt: daysAgo(6),
    startProcessDate: daysAgo(5),
    solutionDate: daysAgo(3),
    imgProcess: "e2e-process.png",
    imgSolution: "e2e-solution.png",
    zone: { __typename: "Zone", name: "E2E Lugar", area: null },
  }),
  // Cancelado, sin prioridad ni imágenes.
  evidence(9004, {
    status: "Cancelado",
    priorityDays: null,
    imgEvidence: "",
    comments: [],
  }),
];

/** Abre /hallazgos con la tabla de datos fijos; `asSupervisor` cambia el rol. */
const openList = async (page: Page, { asSupervisor = false } = {}) => {
  await page.route("**/graphql", (route) =>
    route.fulfill({
      json: {
        data: {
          evidences: { __typename: "Evidences", count: 12, data: EVIDENCES },
        },
      },
    }),
  );
  // Las imágenes del API no existen para estos datos: se sirve un PNG.
  await page.route("**/static/images/**", (route) =>
    route.fulfill({ contentType: "image/png", body: PNG_1X1 }),
  );
  if (asSupervisor) {
    await mockGet(page, "/users/get-information-current-user", {
      ...SUPERVISOR,
      email: "e2e-supervisor@example.com",
      role: "Supervisor",
      isActive: true,
      manufacturingPlants: [PLANT],
      zones: [],
    });
  }
  await mockGet(page, "/users", [SUPERVISOR, OTHER]);
  await page.goto("/hallazgos");
  await expect(page.getByText("E2E Lugar").first()).toBeVisible();
};

const openActions = async (page: Page, id: number) => {
  await page.getByRole("button", { name: `Acciones del hallazgo ${id}` }).click();
  return page.getByRole("menu");
};

test.describe("Hallazgos: acciones", () => {
  test("muestra el detalle de cada estado y agrega un comentario (sin guardar)", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    const writes = await captureWrites(page, {
      respond: ({ path }) =>
        path.startsWith("/evidences/add/comment")
          ? {
              comments: [
                ...EVIDENCES[0].comments,
                {
                  id: 2,
                  comment: "E2E comentario nuevo",
                  user: { name: "Usuario pruebas e2e" },
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : {},
    });
    await openList(page);

    // Abierto (comportamiento inseguro, vencido).
    await (await openActions(page, 9001))
      .getByRole("menuitem", { name: "Ver detalles" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("E2E descripción del hallazgo").first()).toBeVisible();
    await dialog.getByRole("img").first().click();
    await page.getByRole("button", { name: "Cerrar imagen" }).click();

    await dialog.getByRole("tab", { name: /Comentarios/ }).click();
    await expect(dialog.getByText("E2E comentario previo")).toBeVisible();
    await dialog.getByLabel("Agregar comentario").fill("E2E comentario nuevo");
    await dialog.getByRole("button", { name: /Agregar|Comentar|Enviar/ }).click();
    await expect(toast(page, "Comentario agregado correctamente")).toBeVisible();
    await expect(dialog.getByText("E2E comentario nuevo")).toBeVisible();
    expect(writes).toEqual([
      {
        method: "POST",
        path: "/evidences/add/comment/9001",
        body: { comment: "E2E comentario nuevo" },
      },
    ]);
    await dialog.getByRole("button", { name: "Cerrar" }).click();

    // En progreso, Cerrado (la acción muestra el tiempo) y Cancelado.
    for (const [id, item] of [
      [9002, "Ver detalles"],
      [9003, /\d/],
      [9004, "Ver detalles"],
    ] as const) {
      await (await openActions(page, id))
        .getByRole("menuitem", { name: item })
        .first()
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }

    // El chip de estado también abre el detalle.
    await page.getByRole("button", { name: "Cancelado" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("pasa un hallazgo a En progreso con imagen (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (await openActions(page, 9001))
      .getByRole("menuitem", { name: "En progreso" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Evidencia de inicio de proceso",
    });
    const save = dialog.getByRole("button", { name: "Guardar imagen" });
    await expect(save).toBeDisabled();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "proceso.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(dialog.getByAltText("Mountains")).toBeVisible();
    await save.click();
    await expect(toast(page, "Estatus actualizado a En progreso")).toBeVisible();

    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe("/evidences/process/9001");
    expect(String(writes[0].body)).toMatch(/filename="[0-9a-f-]{36}-process\.png"/);
  });

  test("un supervisor cierra un hallazgo de comportamiento inseguro (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page, { asSupervisor: true });

    await (await openActions(page, 9001))
      .getByRole("menuitem", { name: "Cerrar hallazgo" })
      .click();
    const dialog = page.getByRole("dialog", { name: /Imagen la solución/ });
    await expect(
      dialog.getByText("Descripción del comportamiento inseguro:"),
    ).toBeVisible();
    const save = dialog.getByRole("button", { name: "Guardar imagen" });
    await expect(save).toBeDisabled();
    await dialog.locator("#description-multiline-solution").fill("E2E se habló con el equipo");
    await save.click();
    await expect(toast(page, "Hallazgo cerrado correctamente")).toBeVisible();

    expect(writes).toHaveLength(1);
    expect(writes[0].path).toBe("/evidences/solution/9001");
    expect(String(writes[0].body)).toContain("E2E se habló con el equipo");
  });

  test("un supervisor cierra una condición con imagen (sin guardar)", async ({
    page,
  }) => {
    const writes = await captureWrites(page);
    await openList(page, { asSupervisor: true });

    await (await openActions(page, 9002))
      .getByRole("menuitem", { name: "Cerrar hallazgo" })
      .click();
    const dialog = page.getByRole("dialog", { name: /Imagen la solución/ });
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "solucion.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    });
    await expect(dialog.getByAltText("Mountains")).toBeVisible();
    await dialog.getByRole("button", { name: "Guardar imagen" }).click();
    await expect(toast(page, "Hallazgo cerrado correctamente")).toBeVisible();
    expect(String(writes[0].body)).toMatch(/filename="[0-9a-f-]{36}-solution\.png"/);
  });

  test("reasigna responsables (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (await openActions(page, 9001))
      .getByRole("menuitem", { name: "Reasignar" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Reasignar responsables" });
    // Sin responsables asignados, parte de los supervisores.
    await dialog.getByRole("button", { name: `Quitar a ${SUPERVISOR.name}` }).click();
    await expect(dialog.getByRole("button", { name: "Guardar" })).toBeDisabled();

    await pickOption(page, "Responsable", OTHER.name);
    await pickOption(page, "Responsable", OTHER.name);
    await expect(
      dialog.getByRole("button", { name: `Quitar a ${OTHER.name}` }),
    ).toHaveCount(1);
    await dialog.getByRole("button", { name: "Guardar" }).click();
    await expect(
      toast(page, "Responsables reasignados correctamente"),
    ).toBeVisible();

    expect(writes).toEqual([
      {
        method: "PATCH",
        path: "/evidences/reassign/9001",
        body: expect.objectContaining({ responsibleIds: [OTHER.id] }),
      },
    ]);
  });

  test("cancela un hallazgo tras confirmar (sin guardar)", async ({ page }) => {
    const writes = await captureWrites(page);
    await openList(page);

    await (await openActions(page, 9002))
      .getByRole("menuitem", { name: "Cancelar" })
      .click();
    const confirm = page.getByRole("dialog", { name: "Confirmar cancelación" });
    await expect(confirm).toContainText("#9002");
    await confirm.getByRole("button", { name: "Volver" }).click();
    expect(writes).toEqual([]);

    await (await openActions(page, 9002))
      .getByRole("menuitem", { name: "Cancelar" })
      .click();
    await confirm.getByRole("button", { name: "Cancelar hallazgo" }).click();
    await expect(toast(page, "Hallazgo eliminado correctamente")).toBeVisible();
    expect(writes[0]).toMatchObject({
      method: "DELETE",
      path: "/evidences/9002",
    });
  });

  test("pagina la tabla", async ({ page }) => {
    await openList(page);
    const request = page.waitForRequest(
      (r) =>
        r.url().includes("/graphql") &&
        r.postDataJSON()?.variables?.page === 2,
    );
    await page.getByRole("button", { name: "Página siguiente" }).click();
    await request;
    await page.getByLabel(/Filas por página|Rows per page/).click();
    await page.getByRole("option", { name: "10" }).click();
  });

  test("un usuario con permisos especiales puede cerrar y cancelar", async ({
    page,
  }) => {
    const email = "e2e-especial@example.com";
    await mockGet(page, "/users/get-information-current-user", {
      id: 7301,
      name: "E2E Especial",
      email,
      role: "General",
      isActive: true,
      manufacturingPlants: [PLANT],
      zones: [],
    });
    await mockGet(page, "/evidences/permissions/config", {
      supervisorOverrideEmails: [email],
      cancelEvidenceEmails: [email],
    });
    await openList(page);

    const menu = await openActions(page, 9002);
    await expect(menu.getByRole("menuitem", { name: "Cerrar hallazgo" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Reasignar" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Cancelar" })).toBeVisible();
  });

  test("amplía las imágenes de cada etapa de un hallazgo cerrado", async ({
    page,
  }) => {
    const errors = trackPageErrors(page);
    await openList(page);
    await (await openActions(page, 9003))
      .getByRole("menuitem")
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    for (const alt of ["Hallazgo imagen", "Imagen en progreso", "Imagen Solución"]) {
      await dialog.getByAltText(alt).click();
      await page.getByRole("button", { name: "Cerrar imagen" }).click();
      await expect(page.getByRole("button", { name: "Cerrar imagen" })).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
});
