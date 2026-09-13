import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

test.beforeEach(() => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno (ver .env.local).",
  );
});

test("un usuario sin sesión es redirigido a /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("login con credenciales inválidas muestra error en español", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("no-existe@xalachi.test");
  await page.getByLabel("Contraseña").fill("clave-incorrecta");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("login válido lleva al dashboard y muestra el rol del JWT", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(EMAIL!);
  await page.getByLabel("Contraseña").fill(PASSWORD!);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(EMAIL!)).toBeVisible();
  await expect(page.getByText("operador")).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
