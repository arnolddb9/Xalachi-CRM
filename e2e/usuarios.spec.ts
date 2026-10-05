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

test.describe("Usuarios (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un admin puede crear un usuario, cambiarle el rol, suspenderlo y reactivarlo", async ({ page, browser }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const email = `e2e.usuarios.${marca}@xalachi.test`;
    const passwordTemporal = "PruebaE2E-123!";

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/usuarios");

    await page.getByRole("button", { name: "Crear usuario" }).click();
    const formCrear = page.getByTestId("form-crear-usuario");
    await formCrear.getByLabel("Nombre").fill(`E2E Usuarios ${marca}`);
    await formCrear.getByLabel("Correo").fill(email);
    await formCrear.getByLabel("Contraseña temporal").fill(passwordTemporal);
    await seleccionarMd3PorTexto(formCrear.getByTestId("select-role"), "Operador");
    await formCrear.getByRole("button", { name: "Crear" }).click();

    const fila = page.getByTestId("fila-usuario").filter({ hasText: email });
    await expect(fila).toBeVisible();
    await expect(fila.getByTestId("badge-estado")).toHaveText("Activo");

    // Cambiar el rol a vendedor y confirmar que un login fresco lo refleja
    // en el JWT (la claim user_role se recalcula al emitir el access token).
    await seleccionarMd3PorTexto(fila.getByTestId("select-role"), "Vendedor");

    const paginaUsuarioNuevo = await browser.newPage();
    await login(paginaUsuarioNuevo, email, passwordTemporal);
    await expect(paginaUsuarioNuevo.getByText("vendedor")).toBeVisible();
    await paginaUsuarioNuevo.close();

    // Suspender: el botón dispara un window.confirm() nativo.
    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Suspender" }).click();
    await expect(fila.getByTestId("badge-estado")).toHaveText("Suspendido");

    // Un usuario suspendido no puede iniciar sesión: se bloquea a nivel de
    // Supabase Auth (ban), no solo en la fila de la tabla `usuarios`.
    const paginaSuspendido = await browser.newPage();
    await paginaSuspendido.goto("/login");
    await paginaSuspendido.getByLabel("Correo electrónico").fill(email);
    await paginaSuspendido.getByLabel("Contraseña").fill(passwordTemporal);
    await paginaSuspendido.getByRole("button", { name: "Entrar" }).click();
    await expect(
      paginaSuspendido.getByText("Ocurrió un error al iniciar sesión. Inténtalo de nuevo."),
    ).toBeVisible();
    await paginaSuspendido.close();

    await fila.getByRole("button", { name: "Reactivar" }).click();
    await expect(fila.getByTestId("badge-estado")).toHaveText("Activo");

    const paginaReactivado = await browser.newPage();
    await login(paginaReactivado, email, passwordTemporal);
    await expect(paginaReactivado.getByText("vendedor")).toBeVisible();
    await paginaReactivado.close();

    // Limpieza: no hay borrado de usuarios (es "suspender", no eliminar),
    // así que se deja suspendido para no acumular cuentas activas de prueba.
    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Suspender" }).click();
    await expect(fila.getByTestId("badge-estado")).toHaveText("Suspendido");
  });

  test("un admin no puede suspender su propio usuario", async ({ page }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/usuarios");

    const filaPropia = page.getByTestId("fila-usuario").filter({ hasText: "Este es tu usuario." });
    await expect(filaPropia).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await filaPropia.getByRole("button", { name: "Suspender" }).click();

    await expect(page.getByText("No puedes suspender tu propio usuario.")).toBeVisible();
    await expect(filaPropia.getByTestId("badge-estado")).toHaveText("Activo");
  });
});

test.describe("Usuarios (acceso restringido a admin)", () => {
  test.skip(
    !OPERADOR_EMAIL || !OPERADOR_PASSWORD || !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD,
    "Faltan credenciales de operador o vendedor en el entorno.",
  );

  test("un operador que entra a /usuarios por URL es redirigido a Inicio", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/usuarios");
    await expect(page).toHaveURL("/");
  });

  test("un vendedor que entra a /usuarios por URL es redirigido a Inicio", async ({ page }) => {
    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);
    await page.goto("/usuarios");
    await expect(page).toHaveURL("/");
  });
});

test.describe("Mi cuenta (cambio de contraseña propio)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("un usuario puede cambiar su propia contraseña y volver a iniciar sesión con la nueva", async ({
    page,
    browser,
  }) => {
    test.setTimeout(60_000);

    // Se usa un usuario desechable creado para esta prueba, en vez de las
    // cuentas fijas de operador/vendedor del entorno — así no se les cambia
    // la contraseña real y se rompen las demás pruebas que dependen de ella.
    const marca = crypto.randomUUID();
    const email = `e2e.cuenta.${marca}@xalachi.test`;
    const passwordInicial = "PruebaE2E-123!";
    const passwordNueva = "PruebaE2E-456!";

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/usuarios");
    await page.getByRole("button", { name: "Crear usuario" }).click();
    const formCrear = page.getByTestId("form-crear-usuario");
    await formCrear.getByLabel("Nombre").fill(`E2E Cuenta ${marca}`);
    await formCrear.getByLabel("Correo").fill(email);
    await formCrear.getByLabel("Contraseña temporal").fill(passwordInicial);
    await seleccionarMd3PorTexto(formCrear.getByTestId("select-role"), "Operador");
    await formCrear.getByRole("button", { name: "Crear" }).click();

    const fila = page.getByTestId("fila-usuario").filter({ hasText: email });
    await expect(fila).toBeVisible();

    const paginaUsuario = await browser.newPage();
    await login(paginaUsuario, email, passwordInicial);
    // Navegación directa por URL en vez de clicar el enlace del sidebar: en
    // el proyecto "mobile" los NavLinks solo existen en el DOM con el
    // drawer abierto (ver src/components/sidebar.tsx).
    await paginaUsuario.goto("/cuenta");

    await paginaUsuario.getByLabel("Contraseña nueva").fill(passwordNueva);
    await paginaUsuario.getByLabel("Confirmar contraseña").fill(passwordNueva);
    await paginaUsuario.getByRole("button", { name: "Guardar" }).click();
    await expect(paginaUsuario.getByText("Contraseña actualizada correctamente.")).toBeVisible();

    // El botón "Cerrar sesión" solo vive en Inicio (src/features/inicio),
    // no en /cuenta.
    await paginaUsuario.goto("/");
    await paginaUsuario.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(paginaUsuario).toHaveURL(/\/login$/);
    await login(paginaUsuario, email, passwordNueva);
    await paginaUsuario.close();

    // Limpieza: el usuario desechable queda suspendido (no hay borrado).
    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Suspender" }).click();
    await expect(fila.getByTestId("badge-estado")).toHaveText("Suspendido");
  });
});
