import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto, seleccionarMd3PorIndice } from "./md3-helpers";

const OPERADOR_EMAIL = process.env.E2E_USER_EMAIL;
const OPERADOR_PASSWORD = process.env.E2E_USER_PASSWORD;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Compras (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("registrar una compra genera un lote, se puede editar y eliminar", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    // El catálogo de proveedores puede estar vacío (no hay ninguno de
    // ejemplo); se crea uno aquí para poder seleccionarlo en el formulario.
    const nombreProveedor = `Proveedor e2e ${crypto.randomUUID()}`;
    await page.goto("/catalogos/proveedores");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProveedor);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProveedor)).toBeVisible();

    await page.goto("/compras");

    // Folio único como marca para ubicar la fila sin depender del costo o
    // la fecha (que sí pueden coincidir entre corridas).
    const folio = `E2E ${crypto.randomUUID()}`;

    await page.getByRole("button", { name: "Registrar compra" }).click();
    const formRegistrar = page.getByTestId("form-registrar-compra-lote");
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-proveedor_id"), 1);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Verde");
    await formRegistrar.getByLabel("Peso (kg)").fill("80");
    await formRegistrar.getByLabel("Costo total (opcional)").fill("1200");
    await formRegistrar.getByLabel("Folio / factura (opcional)").fill(folio);
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-compra").filter({ hasText: folio });
    await expect(fila).toBeVisible();
    await expect(fila.getByText("Verde")).toBeVisible();
    await expect(fila.getByText(/₡1\s?200,00/)).toBeVisible();

    // El lote generado se puede ver desde el link de la compra
    const hrefLote = await fila.getByRole("link", { name: "Ver lote" }).getAttribute("href");
    expect(hrefLote).toBeTruthy();

    await fila.getByRole("button", { name: "Editar" }).click();
    const formEditar = page.getByTestId("form-editar-compra");
    await formEditar.getByLabel("Costo total (opcional)").fill("1300");
    await formEditar.getByRole("button", { name: "Guardar" }).click();

    await expect(
      page.getByTestId("fila-compra").filter({ hasText: folio }).getByText(/₡1\s?300,00/),
    ).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("fila-compra").filter({ hasText: folio }).getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByTestId("fila-compra").filter({ hasText: folio })).toHaveCount(0);
  });

  test("comprar un insumo suma existencias, y eliminar la compra las revierte", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const nombreProveedor = `Proveedor e2e ${crypto.randomUUID()}`;
    await page.goto("/catalogos/proveedores");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProveedor);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProveedor)).toBeVisible();

    const nombreArticulo = `Bolsas e2e ${crypto.randomUUID()}`;
    await page.goto("/catalogos/articulos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreArticulo);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Insumo");
    await page.getByLabel("Unidad de medida").fill("pieza");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreArticulo)).toBeVisible();

    await page.goto("/compras");
    const folio = `E2E ${crypto.randomUUID()}`;

    await page.getByRole("button", { name: "Registrar compra" }).click();
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo_compra_ui"), "Insumo");
    const formRegistrar = page.getByTestId("form-registrar-compra-articulo");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-proveedor_id"), nombreProveedor);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-articulo_id"), nombreArticulo);
    await formRegistrar.getByLabel("Cantidad").fill("30");
    await formRegistrar.getByLabel("Costo total (opcional)").fill("450");
    await formRegistrar.getByLabel("Folio / factura (opcional)").fill(folio);
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-compra").filter({ hasText: folio });
    await expect(fila).toBeVisible();
    await expect(fila.getByText("Insumo")).toBeVisible();
    await expect(fila.getByText("30 pieza")).toBeVisible();

    // Inventario abre en la pestaña de lotes; hay que cambiar a la de
    // insumos y productos para ver las existencias del artículo.
    await page.goto("/inventario");
    await page.getByText("Insumos", { exact: true }).click();
    const filaArticulo = page.getByTestId("fila-articulo").filter({ hasText: nombreArticulo });
    await expect(filaArticulo.getByText("30 pieza")).toBeVisible();

    await page.goto("/compras");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("fila-compra").filter({ hasText: folio }).getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("fila-compra").filter({ hasText: folio })).toHaveCount(0);

    await page.goto("/inventario");
    await page.getByText("Insumos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreArticulo }).getByText("30 pieza"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreArticulo }).getByText("0 pieza"),
    ).toBeVisible();
  });
});

test.describe("Compras (rol operador, solo lectura)", () => {
  test.skip(!OPERADOR_EMAIL || !OPERADOR_PASSWORD, "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.");

  test("un operador no ve el botón de registrar compra", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/compras");
    await expect(page.getByRole("button", { name: "Registrar compra" })).not.toBeVisible();
  });
});
