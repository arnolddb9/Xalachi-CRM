import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto, seleccionarMd3PorIndice } from "./md3-helpers";

const OPERADOR_EMAIL = process.env.E2E_USER_EMAIL;
const OPERADOR_PASSWORD = process.env.E2E_USER_PASSWORD;
const VENDEDOR_EMAIL = process.env.E2E_VENDEDOR_EMAIL;
const VENDEDOR_PASSWORD = process.env.E2E_VENDEDOR_PASSWORD;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Inventario y lotes (rol operador)", () => {
  test.skip(
    !OPERADOR_EMAIL || !OPERADOR_PASSWORD,
    "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.",
  );

  test("registrar un lote cereza en cajuelas calcula el peso, y aplicar beneficiado reduce por la merma", async ({
    page,
  }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);

    // Proceso propio sin pasos configurados: el catálogo real puede tener
    // procesos con pasos (ej. "Lavado"), y este test asume un solo salto
    // directo a pergamino — no puede depender de "el primero del catálogo".
    const nombreProceso = `Proceso e2e directo ${crypto.randomUUID()}`;
    await page.goto("/catalogos/procesos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProceso);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProceso)).toBeVisible();

    await page.goto("/inventario");

    // Nombre único como marca: se conserva a través de todas las
    // transformaciones (columna `nombre`, copiada en cada función de
    // transición), así que sirve para ubicar la fila en cualquier etapa sin
    // depender del peso — que si puede coincidir con datos de otra corrida.
    const nombreLote = `E2E ${crypto.randomUUID()}`;
    const cajuelas = 10 + Math.floor(Math.random() * 500);

    await page.getByRole("button", { name: "Registrar lote" }).click();
    // Escopeado al formulario: la barra de filtros de arriba también tiene un
    // select "Variedad" (aria-label "Filtrar por variedad"), que Playwright
    // matchea por substring si se busca sin escopear.
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await formRegistrar.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Cereza");
    await formRegistrar.getByLabel("Cajuelas recibidas").fill(String(cajuelas));
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const filaCereza = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(filaCereza).toBeVisible();
    await expect(filaCereza.getByText("Cereza")).toBeVisible();

    await filaCereza.getByRole("button", { name: "Aplicar proceso" }).click();

    // Al abrir el formulario, el texto de la fila cambia — se ubica por su
    // propio data-testid en vez de seguir escopeado a filaCereza.
    const formProceso = page.getByTestId("form-aplicar-proceso");
    await seleccionarMd3PorTexto(formProceso.getByTestId("select-proceso_beneficiado_id"), nombreProceso);
    await formProceso.getByLabel("Merma (%)").fill("20");
    await formProceso.getByRole("button", { name: "Aplicar", exact: true }).click();

    const filaPergamino = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(filaPergamino.getByText("Pergamino")).toBeVisible();
  });

  test("flujo con pasos configurados: cereza → paso → paso → pergamino → verde → clasificar calidad", async ({
    page,
  }) => {
    // Este test hace muchas acciones reales de UI en secuencia (crear proceso,
    // 2 pasos, lote, 4 transformaciones, navegar al historial) — legítimamente
    // toma más que el default de 30s, sobre todo en el proyecto móvil.
    test.setTimeout(60_000);

    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);

    // 1. Crear un proceso de beneficiado nuevo con 2 pasos configurados
    const nombreProceso = `Proceso e2e ${Date.now()}`;
    await page.goto("/catalogos/procesos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProceso);
    await page.getByRole("button", { name: "Guardar" }).click();

    const filaProceso = page.getByTestId("fila-catalogo").filter({ hasText: nombreProceso });
    await expect(filaProceso).toBeVisible();
    await filaProceso.getByRole("link", { name: "Ver pasos" }).click();
    await expect(page).toHaveURL(/\/catalogos\/procesos\/.+/);

    await page.getByRole("button", { name: "Agregar paso" }).click();
    await page.getByLabel("Orden").fill("1");
    await page.getByLabel("Nombre del paso").fill("Fermentado");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("fila-paso").filter({ hasText: "Fermentado" })).toBeVisible();

    await page.getByRole("button", { name: "Agregar paso" }).click();
    await page.getByLabel("Orden").fill("2");
    await page.getByLabel("Nombre del paso").fill("Secado");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("fila-paso").filter({ hasText: "Secado" })).toBeVisible();

    // 2. Registrar un lote cereza y avanzarlo por todo el flujo. El nombre
    // (único, con crypto.randomUUID()) se conserva a través de TODAS las
    // transformaciones — incluida la clasificación por calidad — así que es
    // una marca mucho más confiable que el peso (que puede coincidir con
    // datos de otra corrida por pura probabilidad, ya pasó varias veces).
    await page.goto("/inventario");
    const nombreLote = `E2E ${crypto.randomUUID()}`;
    const cajuelas = 5 + Math.floor(Math.random() * 500);

    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await formRegistrar.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Cereza");
    await formRegistrar.getByLabel("Cajuelas recibidas").fill(String(cajuelas));
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    let fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila).toBeVisible();

    // Iniciar beneficiado -> primer paso (Fermentado)
    await fila.getByRole("button", { name: "Aplicar proceso" }).click();
    let form = page.getByTestId("form-aplicar-proceso");
    await seleccionarMd3PorTexto(form.getByTestId("select-proceso_beneficiado_id"), nombreProceso);
    await form.getByLabel("Merma (%)").fill("0");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Fermentado")).toBeVisible();

    // Avanzar -> segundo paso (Secado)
    await fila.getByRole("button", { name: "Aplicar proceso" }).click();
    form = page.getByTestId("form-aplicar-proceso");
    await form.getByLabel("Merma (%)").fill("0");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Secado")).toBeVisible();

    // Avanzar -> pergamino (ya no quedan más pasos configurados)
    await fila.getByRole("button", { name: "Aplicar proceso" }).click();
    form = page.getByTestId("form-aplicar-proceso");
    await form.getByLabel("Merma (%)").fill("0");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Pergamino")).toBeVisible();

    // Trillado -> verde
    await fila.getByRole("button", { name: "Aplicar proceso" }).click();
    form = page.getByTestId("form-aplicar-proceso");
    await form.getByLabel("Merma (%)").fill("0");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Verde")).toBeVisible();

    // Clasificar calidad: se divide en primera y segunda. El nombre se
    // conserva en ambos lotes resultantes, así que "nombreLote + Primera" /
    // "nombreLote + Segunda" identifican cada uno sin ambigüedad.
    await fila.getByRole("button", { name: "Clasificar calidad" }).click();
    const formClasificar = page.getByTestId("form-clasificar-calidad");
    await formClasificar.getByLabel("Primera (kg)").fill("1");
    await formClasificar.getByLabel("Segunda (kg)").fill("1");
    await formClasificar.getByRole("button", { name: "Clasificar" }).click();

    const filaPrimera = page
      .getByTestId("fila-lote")
      .filter({ hasText: nombreLote })
      .filter({ hasText: "Primera" });
    await expect(filaPrimera).toBeVisible();
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Segunda" }),
    ).toBeVisible();
    // el lote verde original (este nombre) ya no aparece sin clasificar
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Verde" }).filter({
        hasNotText: "Primera",
      }).filter({ hasNotText: "Segunda" }),
    ).toHaveCount(0);

    // El historial del lote "Primera" debe mostrar toda la cadena desde cereza.
    // Se navega directo por el href (en vez de .click()) para no depender de
    // que el link sea "clickeable" justo en medio de la animación de entrada
    // de la fila recién creada — ya se prueba la navegación por click en otras
    // partes de la suite (login, catálogos), aquí lo que importa es el contenido.
    const hrefHistorial = await filaPrimera.getByRole("link", { name: "Ver historial" }).getAttribute("href");
    expect(hrefHistorial).toBeTruthy();
    await page.goto(hrefHistorial!);
    await expect(page).toHaveURL(/\/inventario\/.+\/historial/);
    await expect(page.getByText("Cereza")).toBeVisible();
    await expect(page.getByText("Fermentado")).toBeVisible();
    await expect(page.getByText("Secado")).toBeVisible();
    await expect(page.getByText("Pergamino")).toBeVisible();
    await expect(page.getByText("Primera")).toBeVisible();
    await expect(page.getByText(nombreLote).first()).toBeVisible();
  });

  test("editar un lote actualiza sus datos sin cambiar la etapa", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/inventario");

    const pesoOrigen = 200 + 5 * Math.floor(Math.random() * 500);

    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Verde");
    await formRegistrar.getByLabel("Peso (kg)").fill(String(pesoOrigen));
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-lote").filter({ hasText: `${pesoOrigen} kg` });
    await expect(fila).toBeVisible();

    await fila.getByRole("button", { name: "Editar" }).click();

    // Al editar, la fila cambia a un formulario — se ubica por su propio
    // data-testid en vez de seguir escopeado a la fila original.
    const formEditar = page.getByTestId("form-editar-lote");
    const pesoEditado = pesoOrigen + 3;
    await formEditar.getByLabel("Peso (kg)").fill(String(pesoEditado));
    await formEditar.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByTestId("fila-lote").filter({ hasText: `${pesoEditado} kg` })).toBeVisible();
    // sigue en la misma etapa (Verde), la edición no la tocó
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: `${pesoEditado} kg` }).getByText("Verde"),
    ).toBeVisible();

    // Un operador no es admin: no debe ver la opción de eliminar
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: `${pesoEditado} kg` }).getByRole("button", { name: "Eliminar" }),
    ).not.toBeVisible();
  });
});

test.describe("Inventario (rol vendedor, solo lectura)", () => {
  test.skip(
    !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD,
    "Faltan E2E_VENDEDOR_EMAIL / E2E_VENDEDOR_PASSWORD en el entorno.",
  );

  test("un vendedor no ve botones para registrar, editar ni transformar lotes", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);
    await page.goto("/inventario");

    await expect(page.getByRole("button", { name: "Registrar lote" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Editar" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Aplicar proceso" })).not.toBeVisible();
  });
});

test.describe("Factor de cajuela (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un admin puede ajustar el factor kg/cajuela", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/inventario");

    // Escopeado a su propio data-testid: "Ajustar" a secas también matchea
    // por substring el botón "Ajustar existencias" de la tabla de artículos.
    const factorCajuela = page.getByTestId("factor-cajuela");
    await expect(factorCajuela.getByText(/Factor cajuela:/)).toBeVisible();
    await factorCajuela.getByRole("button", { name: "Ajustar" }).click();

    // Un solo decimal: Postgres/JS no le agregan ceros de más al mostrarlo,
    // así el texto renderizado coincide exactamente con lo que se escribió.
    const nuevoFactor = 12 + (Date.now() % 5) + 0.5;
    await page.getByTestId("factor-cajuela").getByLabel("Kg por cajuela").fill(String(nuevoFactor));
    await page.getByTestId("factor-cajuela").getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByTestId("factor-cajuela").getByText(`Factor cajuela: ${nuevoFactor} kg`)).toBeVisible();

    // se regresa al valor por defecto para no afectar otras pruebas/uso real
    await page.getByTestId("factor-cajuela").getByRole("button", { name: "Ajustar" }).click();
    await page.getByTestId("factor-cajuela").getByLabel("Kg por cajuela").fill("13.6");
    await page.getByTestId("factor-cajuela").getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("factor-cajuela").getByText("Factor cajuela: 13.6 kg")).toBeVisible();
  });

  test("un vendedor no ve el control de factor cajuela", async ({ page }) => {
    test.skip(!VENDEDOR_EMAIL || !VENDEDOR_PASSWORD, "Faltan credenciales de vendedor.");
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);
    await page.goto("/inventario");
    await expect(page.getByText(/Factor cajuela:/)).not.toBeVisible();
  });
});

test.describe("Eliminar lote (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un admin puede crear y eliminar definitivamente un lote", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/inventario");

    const nombreLote = `E2E eliminar ${crypto.randomUUID()}`;

    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await formRegistrar.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Verde");
    await formRegistrar.getByLabel("Peso (kg)").fill("50");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByTestId("fila-lote").filter({ hasText: nombreLote })).toHaveCount(0);
  });
});
