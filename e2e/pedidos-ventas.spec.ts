import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto, seleccionarMd3PorIndice } from "./md3-helpers";

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

test.describe("Pedidos y ventas (roles admin y vendedor)", () => {
  test.skip(
    !VENDEDOR_EMAIL || !VENDEDOR_PASSWORD || !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Faltan credenciales E2E en el entorno.",
  );

  test("vendedor arma un pedido con un producto y café a granel, lo confirma y la venta descuenta inventario", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const nombreProducto = `Producto e2e ${marca}`;
    const nombreLote = `E2E ${marca}`;
    const nombreCliente = `Cliente e2e ${marca}`;

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    // Producto terminado con existencias y precio de catálogo.
    await page.goto("/catalogos/articulos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProducto);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Producto terminado");
    await page.getByLabel("Unidad de medida").fill("bolsa");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProducto)).toBeVisible();

    await page.goto("/inventario");
    await page.getByText("Productos", { exact: true }).click();
    const filaProducto = page.getByTestId("fila-articulo").filter({ hasText: nombreProducto });
    await expect(filaProducto).toBeVisible();
    await filaProducto.getByRole("button", { name: "Ajustar existencias" }).click();
    await page.getByTestId("form-ajustar-stock").getByRole("spinbutton").fill("20");
    await page.getByTestId("form-ajustar-stock").getByRole("button", { name: "Guardar" }).click();
    await expect(filaProducto.getByText("20 bolsa")).toBeVisible();

    await filaProducto.getByRole("button", { name: "Editar precio" }).click();
    await page.getByTestId("form-editar-precio").getByRole("spinbutton").fill("5000");
    await page.getByTestId("form-editar-precio").getByRole("button", { name: "Guardar" }).click();
    await expect(filaProducto.getByText("₡5 000,00")).toBeVisible();

    // Lote propio en verde, disponible para vender a granel.
    await page.getByText("Inventario y lotes", { exact: true }).click();
    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formLote = page.getByTestId("form-registrar-lote");
    await formLote.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formLote.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formLote.getByTestId("select-etapa"), "Verde");
    await formLote.getByLabel("Peso (kg)").fill("10");
    await formLote.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByTestId("fila-lote").filter({ hasText: nombreLote })).toBeVisible();

    await login(page, VENDEDOR_EMAIL!, VENDEDOR_PASSWORD!);

    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    await page.goto("/pedidos");
    await page.getByRole("button", { name: "Registrar pedido" }).click();
    const formPedido = page.getByTestId("form-registrar-pedido");
    await seleccionarMd3PorTexto(formPedido.getByTestId("select-cliente_id"), nombreCliente);
    await formPedido.getByRole("button", { name: "Guardar" }).click();

    const filaPedido = page.getByTestId("fila-pedido").filter({ hasText: nombreCliente });
    await expect(filaPedido).toBeVisible();
    await filaPedido.getByRole("link", { name: "Ver detalle" }).click();
    await expect(page).toHaveURL(/\/pedidos\/.+/);

    const formProductoItem = page.getByTestId("form-agregar-item-producto");
    await seleccionarMd3PorTexto(formProductoItem.getByTestId("select-articulo_id"), nombreProducto);
    await formProductoItem.getByLabel(/^Cantidad/).fill("3");
    await formProductoItem.getByRole("button", { name: "Agregar" }).click();
    await expect(
      page.getByTestId("fila-item-pedido").filter({ hasText: nombreProducto }),
    ).toBeVisible();

    const formGranelItem = page.getByTestId("form-agregar-item-granel");
    await seleccionarMd3PorTexto(formGranelItem.getByTestId("select-lote_id"), nombreLote);
    await formGranelItem.getByLabel("Kg", { exact: true }).fill("2");
    await formGranelItem.getByLabel("Precio por kg (₡)").fill("1500");
    await formGranelItem.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByTestId("fila-item-pedido").filter({ hasText: nombreLote })).toBeVisible();

    // 3 bolsas x ₡5.000 + 2 kg x ₡1.500 = ₡18.000
    await expect(page.getByTestId("costo-total-pedido")).toContainText("₡18 000,00");

    await page.goto("/pedidos");
    await page.getByTestId("fila-pedido").filter({ hasText: nombreCliente }).getByRole("button", { name: "Confirmar" }).click();

    const filaPedidoConfirmado = page.getByTestId("fila-pedido").filter({ hasText: nombreCliente });
    await expect(filaPedidoConfirmado.getByTestId("badge-estado")).toHaveText("Confirmado");

    const hrefVenta = await filaPedidoConfirmado.getByRole("link", { name: "Ver venta" }).getAttribute("href");
    expect(hrefVenta).toBeTruthy();
    await page.goto(hrefVenta!);
    await expect(page).toHaveURL(/\/ventas\/.+/);
    await expect(page.getByText(nombreCliente)).toBeVisible();
    await expect(page.getByText("Estado de pago: Pendiente")).toBeVisible();
    await expect(page.getByTestId("costo-total-venta")).toContainText("₡18 000,00");

    // El stock del producto y el peso del lote quedaron descontados.
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);
    await page.goto("/inventario");
    await page.getByText("Productos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreProducto }).getByText("17 bolsa"),
    ).toBeVisible();
    await page.getByText("Inventario y lotes", { exact: true }).click();
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).getByText(/8 kg/),
    ).toBeVisible();
  });

  test("marcar una venta como pagada y luego eliminarla revierte el inventario", async ({ page }) => {
    test.setTimeout(60_000);

    const marca = crypto.randomUUID();
    const nombreProducto = `Producto e2e ${marca}`;
    const nombreCliente = `Cliente e2e ${marca}`;

    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    await page.goto("/catalogos/articulos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProducto);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Producto terminado");
    await page.getByLabel("Unidad de medida").fill("bolsa");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProducto)).toBeVisible();

    await page.goto("/inventario");
    await page.getByText("Productos", { exact: true }).click();
    const filaProducto = page.getByTestId("fila-articulo").filter({ hasText: nombreProducto });
    await filaProducto.getByRole("button", { name: "Ajustar existencias" }).click();
    await page.getByTestId("form-ajustar-stock").getByRole("spinbutton").fill("10");
    await page.getByTestId("form-ajustar-stock").getByRole("button", { name: "Guardar" }).click();
    await filaProducto.getByRole("button", { name: "Editar precio" }).click();
    await page.getByTestId("form-editar-precio").getByRole("spinbutton").fill("2000");
    await page.getByTestId("form-editar-precio").getByRole("button", { name: "Guardar" }).click();

    await page.goto("/catalogos/clientes");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreCliente);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Menudeo");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreCliente)).toBeVisible();

    await page.goto("/pedidos");
    await page.getByRole("button", { name: "Registrar pedido" }).click();
    const formPedido = page.getByTestId("form-registrar-pedido");
    await seleccionarMd3PorTexto(formPedido.getByTestId("select-cliente_id"), nombreCliente);
    await formPedido.getByRole("button", { name: "Guardar" }).click();

    await page.getByTestId("fila-pedido").filter({ hasText: nombreCliente }).getByRole("link", { name: "Ver detalle" }).click();
    const formProductoItem = page.getByTestId("form-agregar-item-producto");
    await seleccionarMd3PorTexto(formProductoItem.getByTestId("select-articulo_id"), nombreProducto);
    await formProductoItem.getByLabel(/^Cantidad/).fill("4");
    await formProductoItem.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByTestId("fila-item-pedido")).toBeVisible();

    await page.goto("/pedidos");
    await page.getByTestId("fila-pedido").filter({ hasText: nombreCliente }).getByRole("button", { name: "Confirmar" }).click();
    const hrefVenta = await page
      .getByTestId("fila-pedido")
      .filter({ hasText: nombreCliente })
      .getByRole("link", { name: "Ver venta" })
      .getAttribute("href");

    await page.goto("/ventas");
    const filaVenta = page.getByTestId("fila-venta").filter({ hasText: nombreCliente });
    await expect(filaVenta.getByTestId("badge-estado-pago")).toHaveText("Pendiente");
    await filaVenta.getByRole("button", { name: "Marcar pagada" }).click();
    await expect(filaVenta.getByTestId("badge-estado-pago")).toHaveText("Pagado");

    page.once("dialog", (dialog) => dialog.accept());
    await filaVenta.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("fila-venta").filter({ hasText: nombreCliente })).not.toBeVisible();

    await page.goto("/inventario");
    await page.getByText("Productos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreProducto }).getByText("10 bolsa"),
    ).toBeVisible();

    expect(hrefVenta).toBeTruthy();
  });
});

test.describe("Pedidos (rol operador, sin acceso de escritura)", () => {
  test.skip(!OPERADOR_EMAIL || !OPERADOR_PASSWORD, "Faltan E2E_USER_EMAIL / E2E_USER_PASSWORD en el entorno.");

  test("un operador no ve el botón de registrar pedido", async ({ page }) => {
    await login(page, OPERADOR_EMAIL!, OPERADOR_PASSWORD!);
    await page.goto("/pedidos");
    await expect(page.getByRole("button", { name: "Registrar pedido" })).not.toBeVisible();
  });
});
