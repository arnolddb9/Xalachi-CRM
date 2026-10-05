import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto } from "./md3-helpers";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const OPERADOR_EMAIL = process.env.E2E_USER_EMAIL;
const OPERADOR_PASSWORD = process.env.E2E_USER_PASSWORD;
const VENDEDOR_EMAIL = process.env.E2E_VENDEDOR_EMAIL;
const VENDEDOR_PASSWORD = process.env.E2E_VENDEDOR_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

// formatoMoneda da algo como "₡15 000,00" (espacio de miles, coma decimal).
function parseMonto(texto: string): number {
  return Number(texto.replace(/[^\d,]/g, "").replace(",", "."));
}

async function totalGastos(page: Page): Promise<number> {
  const texto = await page.getByTestId("tarjeta-gastos-total").locator("p").last().innerText();
  return parseMonto(texto);
}

test.describe("Gastos (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un admin puede registrar un gasto operativo, verlo reflejado en Reportes y eliminarlo", async ({ page }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const monto = 15000;

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    await page.goto("/reportes");
    const totalAntes = await totalGastos(page);

    await page.goto("/gastos");
    await page.getByRole("button", { name: "Registrar gasto" }).click();
    const form = page.getByTestId("form-registrar-gasto");
    await seleccionarMd3PorTexto(form.getByTestId("select-categoria_id"), "Electricidad");
    await form.getByLabel("Monto (₡)").fill(String(monto));
    await form.getByLabel("Descripción (opcional)").fill(`E2E gasto ${marca}`);
    await form.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-gasto").filter({ hasText: marca });
    await expect(fila).toBeVisible();
    await expect(fila).toContainText("Electricidad");
    await expect(fila).toContainText("₡15 000,00");

    await page.goto("/reportes");
    await expect(page.getByTestId("fila-gasto-operativo").filter({ hasText: "Electricidad" })).toBeVisible();
    const totalDespues = await totalGastos(page);
    expect(totalDespues).toBeCloseTo(totalAntes + monto, 2);

    await page.goto("/gastos");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("fila-gasto").filter({ hasText: marca }).getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("fila-gasto").filter({ hasText: marca })).toHaveCount(0);

    await page.goto("/reportes");
    const totalFinal = await totalGastos(page);
    expect(totalFinal).toBeCloseTo(totalAntes, 2);
  });
});

test.describe("Gastos (acceso restringido a admin, para operador y vendedor)", () => {
  test.skip(
    !OPERADOR_EMAIL || !OPERADOR_PASSWORD || !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD,
    "Faltan credenciales de operador o vendedor en el entorno.",
  );

  test("un operador no ve el botón Registrar gasto (solo lectura)", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/gastos");
    await expect(page.getByRole("button", { name: "Registrar gasto" })).not.toBeVisible();
  });

  test("un vendedor no ve el botón Registrar gasto (solo lectura)", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);
    await page.goto("/gastos");
    await expect(page.getByRole("button", { name: "Registrar gasto" })).not.toBeVisible();
  });

  test("un operador no puede escribir en categorías de gasto (solo admin)", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/catalogos/categorias-gasto");
    await expect(page.getByRole("button", { name: "Nuevo" })).not.toBeVisible();
  });
});

test.describe("Categorías de gasto (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("el catálogo viene precargado y un admin puede crear y eliminar una categoría", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/catalogos/categorias-gasto");

    await expect(page.getByTestId("fila-catalogo").filter({ hasText: "Electricidad" })).toBeVisible();
    await expect(page.getByTestId("fila-catalogo").filter({ hasText: "Agua" })).toBeVisible();
    await expect(page.getByTestId("fila-catalogo").filter({ hasText: "Gas" })).toBeVisible();

    const nombre = `E2E categoria ${crypto.randomUUID()}`;
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombre);
    await page.getByRole("button", { name: "Guardar" }).click();

    const fila = page.getByTestId("fila-catalogo").filter({ hasText: nombre });
    await expect(fila).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("fila-catalogo").filter({ hasText: nombre })).toHaveCount(0);
  });
});
