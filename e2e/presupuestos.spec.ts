import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto } from "./md3-helpers";

const VENDEDOR_EMAIL = process.env.E2E_VENDEDOR_EMAIL;
const VENDEDOR_PASSWORD = process.env.E2E_VENDEDOR_PASSWORD;
const OPERADOR_EMAIL = process.env.E2E_USER_EMAIL;
const OPERADOR_PASSWORD = process.env.E2E_USER_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Presupuestos de servicio (rol vendedor)", () => {
  test.skip(!VENDEDOR_EMAIL || !VENDEDOR_PASSWORD, "Faltan E2E_VENDEDOR_EMAIL / E2E_VENDEDOR_PASSWORD en el entorno.");

  test("crear un presupuesto en verde, agregar 2 procesos, ver el total y aprobarlo genera la orden real", async ({
    page,
  }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);

    const nombreCliente = `Cliente e2e ${crypto.randomUUID()}`;
    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    await page.goto("/presupuestos");
    await page.getByRole("button", { name: "Registrar presupuesto" }).click();
    const formRegistrar = page.getByTestId("form-registrar-presupuesto");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-cliente_id"), nombreCliente);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa_entrada"), "Verde");
    await formRegistrar.getByLabel("Cantidad estimada (kg)").fill("10");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const filaPresupuesto = page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente });
    await expect(filaPresupuesto).toBeVisible();
    await expect(filaPresupuesto.getByTestId("badge-estado")).toHaveText("Borrador");

    await filaPresupuesto.getByRole("link", { name: "Ver detalle" }).click();
    await expect(page).toHaveURL(/\/presupuestos\/.+/);

    const formItem = page.getByTestId("form-agregar-item-presupuesto");
    await seleccionarMd3PorTexto(formItem.getByTestId("select-tipo_proceso"), "Tueste");
    await formItem.getByLabel("Kg estimados").fill("4");
    await formItem.getByRole("button", { name: "Agregar" }).click();
    await expect(
      page.getByTestId("fila-item-presupuesto").filter({ hasText: "Tueste — 4 kg" }),
    ).toBeVisible();

    await seleccionarMd3PorTexto(formItem.getByTestId("select-tipo_proceso"), "Molido");
    await formItem.getByLabel("Kg estimados").fill("2");
    await formItem.getByRole("button", { name: "Agregar" }).click();
    await expect(
      page.getByTestId("fila-item-presupuesto").filter({ hasText: "Molido — 2 kg" }),
    ).toBeVisible();

    await expect(page.getByTestId("costo-total-presupuesto")).toBeVisible();

    // Aprobar desde la lista: se convierte en una orden de servicio real
    await page.goto("/presupuestos");
    const filaAntesAprobar = page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente });
    await filaAntesAprobar.getByRole("button", { name: "Aprobar" }).click();

    await expect(
      page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente }).getByTestId("badge-estado"),
    ).toHaveText("Aprobado");

    const hrefOrden = await page
      .getByTestId("fila-presupuesto")
      .filter({ hasText: nombreCliente })
      .getByRole("link", { name: "Ver orden" })
      .getAttribute("href");
    expect(hrefOrden).toBeTruthy();
    await page.goto(hrefOrden!);
    await expect(page).toHaveURL(/\/servicios\/.+/);
    await expect(page.getByText(nombreCliente)).toBeVisible();
    await expect(page.getByTestId("fila-lote-servicio").filter({ hasText: "Verde" })).toBeVisible();
  });

  test("rechazar un presupuesto no genera una orden", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);

    const nombreCliente = `Cliente e2e ${crypto.randomUUID()}`;
    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    await page.goto("/presupuestos");
    await page.getByRole("button", { name: "Registrar presupuesto" }).click();
    const formRegistrar = page.getByTestId("form-registrar-presupuesto");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-cliente_id"), nombreCliente);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa_entrada"), "Pergamino");
    await formRegistrar.getByLabel("Cantidad estimada (kg)").fill("5");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente });
    await expect(fila).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Rechazar" }).click();

    await expect(
      page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente }).getByTestId("badge-estado"),
    ).toHaveText("Rechazado");
    await expect(
      page.getByTestId("fila-presupuesto").filter({ hasText: nombreCliente }).getByRole("link", { name: "Ver orden" }),
    ).not.toBeVisible();
  });
});

test.describe("Presupuestos (rol operador, sin acceso de escritura)", () => {
  test.skip(!OPERADOR_EMAIL || !OPERADOR_PASSWORD, "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.");

  test("un operador no ve el botón de registrar presupuesto", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/presupuestos");
    await expect(page.getByRole("button", { name: "Registrar presupuesto" })).not.toBeVisible();
  });
});
