import { test, expect, type Page } from "@playwright/test";

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

test.describe("Catálogo simple — variedades (rol operador)", () => {
  test.skip(
    !OPERADOR_EMAIL || !OPERADOR_PASSWORD,
    "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.",
  );

  test("crear, editar y desactivar una variedad", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);

    const nombre = `Geisha e2e ${Date.now()}`;
    await page.goto("/catalogos/variedades");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText(nombre)).toBeVisible();

    // Se identifica la fila por su data-testid, filtrada por el nombre único
    // (evita ambigüedad con divs anidados que también "contienen" el texto)
    const fila = page.getByTestId("fila-catalogo").filter({ hasText: nombre });
    await fila.getByRole("button", { name: "Editar" }).click();
    const nombreEditado = `${nombre} editado`;
    await page.getByLabel("Nombre").fill(nombreEditado);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreEditado)).toBeVisible();

    const filaEditada = page.getByTestId("fila-catalogo").filter({ hasText: nombreEditado });
    await filaEditada.getByRole("button", { name: "Desactivar" }).click();
    await expect(filaEditada.getByText("inactivo")).toBeVisible();

    // Un operador no es admin: no debe ver la opción de eliminar
    await expect(filaEditada.getByRole("button", { name: "Eliminar" })).not.toBeVisible();
  });
});

test.describe("Eliminar catálogo (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un admin puede crear y eliminar definitivamente una variedad", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const nombre = `Bourbon e2e ${Date.now()}`;
    await page.goto("/catalogos/variedades");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombre)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    const fila = page.getByTestId("fila-catalogo").filter({ hasText: nombre });
    await fila.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText(nombre)).not.toBeVisible();
  });
});

test.describe("Catálogo rico — clientes (rol vendedor)", () => {
  test.skip(
    !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD,
    "Faltan E2E_VENDEDOR_EMAIL / E2E_VENDEDOR_PASSWORD en el entorno.",
  );

  test("crear un cliente de mayoreo con datos de contacto", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);

    const nombre = `Cliente e2e ${Date.now()}`;
    await page.goto("/catalogos/clientes");

    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByLabel("Tipo").selectOption("mayoreo");
    await page.getByLabel("Correo").fill("cliente-e2e@xalachi.test");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText(nombre)).toBeVisible();
  });

  test("un vendedor no puede escribir en proveedores (solo admin)", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);
    await page.goto("/catalogos/proveedores");
    await expect(page.getByRole("button", { name: "Nuevo" })).not.toBeVisible();
  });
});
