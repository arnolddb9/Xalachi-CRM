import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto } from "./md3-helpers";

const VENDEDOR_EMAIL = process.env.E2E_VENDEDOR_EMAIL;
const VENDEDOR_PASSWORD = process.env.E2E_VENDEDOR_PASSWORD;
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

test.describe("Servicios a terceros encadenables (rol vendedor)", () => {
  test.skip(
    !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Faltan credenciales de vendedor o admin en el entorno.",
  );

  test("pelar, clasificar, tostar y moler el café de un cliente muestra el costo de cada paso y el total", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const nombrePerfil = `Perfil e2e ${marca}`;

    // El perfil de tueste y las tarifas requieren admin/operador y admin
    // respectivamente; se preparan antes de entrar como vendedor.
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/catalogos/tueste");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombrePerfil);
    await seleccionarMd3PorTexto(page.getByTestId("select-nivel"), "Medio");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombrePerfil)).toBeVisible();

    await page.goto("/servicios");
    await page.getByRole("button", { name: "Ajustar" }).click();
    const formTarifas = page.getByTestId("form-tarifas-servicio");
    await formTarifas.getByLabel("Pelado (₡/kg)").fill("2");
    await formTarifas.getByLabel("Clasificación (₡/kg)").fill("1");
    await formTarifas.getByLabel("Tueste (₡/kg)").fill("10");
    await formTarifas.getByLabel("Molido (₡/kg)").fill("1.5");
    await formTarifas.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(/Pelado ₡2,00/)).toBeVisible();

    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);

    const nombreCliente = `Cliente e2e ${marca}`;
    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    // Registrar la orden: 10 kg en pergamino
    await page.goto("/servicios");
    await page.getByRole("button", { name: "Registrar servicio" }).click();
    const formRegistrar = page.getByTestId("form-registrar-servicio");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-cliente_id"), nombreCliente);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa_entrada"), "Pergamino");
    await formRegistrar.getByLabel("Cantidad recibida (kg)").fill("10");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const filaOrden = page.getByTestId("fila-servicio").filter({ hasText: nombreCliente });
    await expect(filaOrden).toBeVisible();
    await expect(filaOrden.getByTestId("badge-estado")).toHaveText("Pendiente");

    await filaOrden.getByRole("link", { name: "Ver detalle" }).click();
    await expect(page).toHaveURL(/\/servicios\/.+/);

    // Pelar solo 6 de los 10 kg (parcial) — sin merma para números exactos
    const filaLote = page.getByTestId("fila-lote-servicio").filter({ hasText: "Pergamino" });
    await expect(filaLote).toBeVisible();
    await filaLote.getByRole("button", { name: "Pelar" }).click();
    const form = page.getByTestId("form-pelado-servicio");
    await form.getByLabel("Cantidad a pelar (kg)").fill("6");
    await form.getByLabel("Merma (%)").fill("0");
    await form.getByRole("button", { name: "Pelar", exact: true }).click();

    // Queda 4 kg en pergamino disponibles, y un nuevo lote de 6 kg en verde
    await expect(
      page.getByTestId("fila-lote-servicio").filter({ hasText: "Pergamino" }).getByText("4 kg disponibles"),
    ).toBeVisible();
    const filaVerde = page.getByTestId("fila-lote-servicio").filter({ hasText: "Verde" }).first();
    await expect(filaVerde.getByText("6 kg disponibles")).toBeVisible();

    // Clasificar los 6 kg verdes en 4 primera + 2 segunda
    await filaVerde.getByRole("button", { name: "Clasificar" }).click();
    const formClasificar = page.getByTestId("form-clasificacion-servicio");
    await formClasificar.getByLabel("Primera (kg)").fill("4");
    await formClasificar.getByLabel("Segunda (kg)").fill("2");
    await formClasificar.getByRole("button", { name: "Clasificar" }).click();

    const filaPrimera = page
      .getByTestId("fila-lote-servicio")
      .filter({ hasText: "Verde" })
      .filter({ hasText: "Primera" });
    await expect(filaPrimera.getByText("4 kg disponibles")).toBeVisible();
    await expect(
      page.getByTestId("fila-lote-servicio").filter({ hasText: "Verde" }).filter({ hasText: "Segunda" }).getByText("2 kg disponibles"),
    ).toBeVisible();

    // Tostar los 4 kg de primera
    await filaPrimera.getByRole("button", { name: "Tostar" }).click();
    const formTueste = page.getByTestId("form-tueste-servicio");
    await seleccionarMd3PorTexto(formTueste.getByTestId("select-perfil_tueste_id"), nombrePerfil);
    await formTueste.getByLabel("Cantidad a tostar (kg)").fill("4");
    await formTueste.getByLabel("Merma (%)").fill("0");
    await formTueste.getByRole("button", { name: "Tostar", exact: true }).click();

    const filaTostado = page.getByTestId("fila-lote-servicio").filter({ hasText: "Tostado" });
    await expect(filaTostado.getByText("4 kg disponibles")).toBeVisible();

    // Moler solo 1.5 de los 4 kg tostados (parcial)
    await filaTostado.getByRole("button", { name: "Moler" }).click();
    const formMolido = page.getByTestId("form-molido-servicio");
    await formMolido.getByLabel("Cantidad a moler (kg)").fill("1.5");
    await formMolido.getByLabel("Merma (%)").fill("0");
    await formMolido.getByRole("button", { name: "Moler", exact: true }).click();

    await expect(
      page.getByTestId("fila-lote-servicio").filter({ hasText: "Tostado" }).getByText("2.5 kg disponibles"),
    ).toBeVisible();
    await expect(
      page.getByTestId("fila-lote-servicio").filter({ hasText: "Molido" }).getByText("1.5 kg disponibles"),
    ).toBeVisible();

    // Desglose de costo: pelado 6*2=12, clasificación 6*1=6, tueste 4*10=40, molido 1.5*1.5=2.25 -> total 60.25
    await expect(page.getByText("Pelado — 6 kg × ₡2,00/kg")).toBeVisible();
    await expect(page.getByText("Clasificación — 4 kg × ₡1,00/kg")).toBeVisible();
    await expect(page.getByText("Clasificación — 2 kg × ₡1,00/kg")).toBeVisible();
    await expect(page.getByText("Tueste — 4 kg × ₡10,00/kg")).toBeVisible();
    await expect(page.getByText("Molido — 1.5 kg × ₡1,50/kg")).toBeVisible();
    await expect(page.getByTestId("costo-total").getByText("₡60,25")).toBeVisible();

    // Marcar entregado desde la lista
    await page.goto("/servicios");
    const filaFinal = page.getByTestId("fila-servicio").filter({ hasText: nombreCliente });
    await filaFinal.getByRole("button", { name: "Marcar entregado" }).click();

    // Las órdenes entregadas se ocultan por defecto — hay que revelarlas
    // con "Ver entregados" para verificar el estado final.
    await page.getByRole("button", { name: /Ver entregados/ }).click();
    await expect(
      page.getByTestId("fila-servicio").filter({ hasText: nombreCliente }).getByTestId("badge-estado"),
    ).toHaveText("Entregado");
  });

  test("un cliente que trae cereza indica cajuelas y un proceso de beneficiado, y avanza paso a paso hasta pergamino", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const nombreProceso = `Proceso e2e servicio ${marca}`;

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    // Proceso de beneficiado con 1 paso configurado (Fermentado), para
    // probar el avance intermedio antes de llegar a pergamino.
    await page.goto("/catalogos/procesos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProceso);
    await page.getByRole("button", { name: "Guardar" }).click();
    const filaProceso = page.getByTestId("fila-catalogo").filter({ hasText: nombreProceso });
    await expect(filaProceso).toBeVisible();
    await filaProceso.getByRole("link", { name: "Ver pasos" }).click();
    await page.getByRole("button", { name: "Agregar paso" }).click();
    await page.getByLabel("Orden").fill("1");
    await page.getByLabel("Nombre del paso").fill("Fermentado");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("fila-paso").filter({ hasText: "Fermentado" })).toBeVisible();

    await page.goto("/servicios");
    await page.getByRole("button", { name: "Ajustar" }).click();
    await page.getByTestId("form-tarifas-servicio").getByLabel("Beneficiado (₡/kg)").fill("3");
    await page.getByTestId("form-tarifas-servicio").getByRole("button", { name: "Guardar" }).click();

    const nombreCliente = `Cliente e2e ${marca}`;
    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    await page.goto("/servicios");
    await page.getByRole("button", { name: "Registrar servicio" }).click();
    const formRegistrar = page.getByTestId("form-registrar-servicio");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-cliente_id"), nombreCliente);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa_entrada"), "Cereza");
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-proceso_beneficiado_id"), nombreProceso);
    await formRegistrar.getByLabel("Cajuelas recibidas").fill("10");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const filaOrden = page.getByTestId("fila-servicio").filter({ hasText: nombreCliente });
    await expect(filaOrden).toBeVisible();
    await filaOrden.getByRole("link", { name: "Ver detalle" }).click();

    const filaCereza = page.getByTestId("fila-lote-servicio").filter({ hasText: "Cereza" });
    await expect(filaCereza).toBeVisible();
    await expect(filaCereza.getByText(nombreProceso)).toBeVisible();

    // Avanzar de cereza al primer paso configurado (Fermentado)
    await filaCereza.getByRole("button", { name: "Aplicar beneficiado" }).click();
    const formBeneficiado1 = page.getByTestId("form-beneficiado-servicio");
    await formBeneficiado1.getByLabel("Cantidad a avanzar (kg)").fill("10");
    await formBeneficiado1.getByLabel("Merma (%)").fill("0");
    await formBeneficiado1.getByRole("button", { name: "Avanzar" }).click();

    const filaFermentado = page.getByTestId("fila-lote-servicio").filter({ hasText: "Fermentado" });
    await expect(filaFermentado).toBeVisible();

    // Avanzar de Fermentado a pergamino (ya no quedan más pasos configurados)
    await filaFermentado.getByRole("button", { name: "Aplicar beneficiado" }).click();
    const formBeneficiado2 = page.getByTestId("form-beneficiado-servicio");
    await formBeneficiado2.getByLabel("Cantidad a avanzar (kg)").fill("10");
    await formBeneficiado2.getByLabel("Merma (%)").fill("0");
    await formBeneficiado2.getByRole("button", { name: "Avanzar" }).click();

    await expect(page.getByTestId("fila-lote-servicio").filter({ hasText: "Pergamino" })).toBeVisible();

    // El beneficiado se cobra una sola vez por todo el proceso (no por
    // paso intermedio): el paso a Fermentado queda en ₡0,00 y solo el
    // paso final, que llega a pergamino, carga la tarifa.
    await expect(page.getByText("Beneficiado — 10 kg × ₡0,00/kg")).toHaveCount(1);
    await expect(page.getByText("Beneficiado — 10 kg × ₡3,00/kg")).toHaveCount(1);
  });
});

test.describe("Servicios a terceros (rol operador, sin acceso de escritura)", () => {
  test.skip(!OPERADOR_EMAIL || !OPERADOR_PASSWORD, "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.");

  test("un operador no ve el botón de registrar servicio", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/servicios");
    await expect(page.getByRole("button", { name: "Registrar servicio" })).not.toBeVisible();
  });
});
