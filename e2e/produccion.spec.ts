import { test, expect, type Page } from "@playwright/test";
import { seleccionarMd3PorTexto, seleccionarMd3PorIndice } from "./md3-helpers";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Producción: tueste, molido y empacado (rol admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Faltan E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en el entorno.");

  test("tostar, moler y empacar descuenta el insumo y suma el producto; el lote conserva el resto (empacado parcial)", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const marca = crypto.randomUUID();
    const nombrePresentacion = `Bolsa e2e ${marca}`;
    const nombreProducto = `Café e2e ${marca}`;
    const nombreInsumo = `Bolsa insumo e2e ${marca}`;
    const nombrePerfil = `Perfil e2e ${marca}`;

    // El catálogo de perfiles de tueste puede estar vacío; se crea uno aquí
    // para poder seleccionarlo al tostar.
    await page.goto("/catalogos/tueste");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombrePerfil);
    await seleccionarMd3PorTexto(page.getByTestId("select-nivel"), "Medio");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombrePerfil)).toBeVisible();

    await page.goto("/catalogos/presentaciones");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre (ej. Bolsa 250g)").fill(nombrePresentacion);
    await page.getByLabel("Peso en gramos").fill("250");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombrePresentacion)).toBeVisible();

    await page.goto("/catalogos/articulos");
    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreProducto);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Producto terminado");
    await page.getByLabel("Unidad de medida").fill("bolsa");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreProducto)).toBeVisible();

    await page.getByRole("button", { name: "Nuevo" }).click();
    await page.getByLabel("Nombre").fill(nombreInsumo);
    await seleccionarMd3PorTexto(page.getByTestId("select-tipo"), "Insumo");
    await page.getByLabel("Unidad de medida").fill("pieza");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText(nombreInsumo)).toBeVisible();

    // Insumo con existencia inicial suficiente para empacar después
    await page.goto("/inventario");
    await page.getByText("Insumos", { exact: true }).click();
    await page.getByTestId("fila-articulo").filter({ hasText: nombreInsumo }).getByRole("button", { name: "Ajustar existencias" }).click();
    await page.getByTestId("form-ajustar-stock").getByRole("spinbutton").fill("100");
    await page.getByTestId("form-ajustar-stock").getByRole("button", { name: "Guardar" }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreInsumo }).getByText("100 pieza"),
    ).toBeVisible();

    // Registrar un lote directo en verde
    const nombreLote = `E2E ${marca}`;
    await page.getByText("Inventario y lotes", { exact: true }).click();
    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await formRegistrar.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Verde");
    await formRegistrar.getByLabel("Peso (kg)").fill("10");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    let fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila).toBeVisible();

    // Tostar
    await fila.getByRole("button", { name: "Tostar" }).click();
    let form = page.getByTestId("form-aplicar-proceso");
    await seleccionarMd3PorIndice(form.getByTestId("select-perfil_tueste_id"), 1);
    await form.getByLabel("Merma (%)").fill("10");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Tostado")).toBeVisible();

    // Moler
    await fila.getByRole("button", { name: "Moler" }).click();
    form = page.getByTestId("form-aplicar-proceso");
    await form.getByLabel("Merma (%)").fill("5");
    await form.getByRole("button", { name: "Aplicar", exact: true }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila.getByText("Molido")).toBeVisible();

    // Peso disponible tras 2 mermas: 10 * 0.9 * 0.95 = 8.55 kg — empacar 10
    // bolsas de 250g (2.5 kg) deja el resto disponible en el lote.
    await fila.getByRole("button", { name: "Empacar" }).click();
    const formEmpacar = page.getByTestId("form-empacar");
    await seleccionarMd3PorTexto(formEmpacar.getByTestId("select-articulo_id"), nombreProducto);
    await seleccionarMd3PorTexto(formEmpacar.getByTestId("select-presentacion_id"), `${nombrePresentacion} (250 g)`);
    await formEmpacar.getByLabel("Unidades a empacar").fill("10");
    await seleccionarMd3PorTexto(formEmpacar.getByTestId("select-insumo_articulo_id"), nombreInsumo);
    await formEmpacar.getByRole("button", { name: "Empacar" }).click();

    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    await expect(fila).toBeVisible();
    await expect(fila.getByText("Molido")).toBeVisible();
    await expect(fila.getByText("6.05 kg")).toBeVisible();

    await page.getByText("Productos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreProducto }).getByText("10 bolsa"),
    ).toBeVisible();
    await page.getByText("Insumos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreInsumo }).getByText("90 pieza"),
    ).toBeVisible();

    // El historial muestra el empacado, y eliminarlo revierte todo. Hay que
    // volver a la pestaña de lotes: el contenido de la otra pestaña queda
    // con `hidden`, y los elementos ocultos no se resuelven por rol.
    await page.getByText("Inventario y lotes", { exact: true }).click();
    fila = page.getByTestId("fila-lote").filter({ hasText: nombreLote });
    const hrefHistorial = await fila.getByRole("link", { name: "Ver historial" }).getAttribute("href");
    expect(hrefHistorial).toBeTruthy();
    await page.goto(hrefHistorial!);
    const filaEmpacado = page.getByTestId("fila-empacado").filter({ hasText: nombreProducto });
    await expect(filaEmpacado).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await filaEmpacado.getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByTestId("fila-empacado").filter({ hasText: nombreProducto })).toHaveCount(0);

    await page.goto("/inventario");
    await page.getByText("Productos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreProducto }).getByText("0 bolsa"),
    ).toBeVisible();
    await page.getByText("Insumos", { exact: true }).click();
    await expect(
      page.getByTestId("fila-articulo").filter({ hasText: nombreInsumo }).getByText("100 pieza"),
    ).toBeVisible();
    await page.getByText("Inventario y lotes", { exact: true }).click();
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).getByText("8.55 kg"),
    ).toBeVisible();
  });

  test("tostar y moler una parte del lote deja el resto disponible en la etapa de origen", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL!, ADMIN_PASSWORD!);

    const nombreLote = `E2E ${crypto.randomUUID()}`;
    await page.goto("/inventario");
    await page.getByRole("button", { name: "Registrar lote" }).click();
    const formRegistrar = page.getByTestId("form-registrar-lote");
    await formRegistrar.getByLabel("Nombre del lote (opcional)").fill(nombreLote);
    await seleccionarMd3PorIndice(formRegistrar.getByTestId("select-variedad_id"), 1);
    await seleccionarMd3PorTexto(formRegistrar.getByTestId("select-etapa"), "Verde");
    await formRegistrar.getByLabel("Peso (kg)").fill("10");
    await formRegistrar.getByRole("button", { name: "Guardar" }).click();

    const filaVerde = page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Verde" });
    await expect(filaVerde).toBeVisible();

    // Tostar solo 4 de los 10 kg disponibles (sin merma, para números exactos)
    await filaVerde.getByRole("button", { name: "Tostar" }).click();
    const formTueste = page.getByTestId("form-aplicar-proceso");
    await seleccionarMd3PorIndice(formTueste.getByTestId("select-perfil_tueste_id"), 1);
    await formTueste.getByLabel("Cantidad a tostar (kg)").fill("4");
    await formTueste.getByLabel("Merma (%)").fill("0");
    await formTueste.getByRole("button", { name: "Aplicar", exact: true }).click();

    // El lote original sigue en verde con el resto (6 kg), y aparece un
    // nuevo lote tostado de 4 kg — ambos con el mismo nombre.
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Verde" }).getByText("6 kg"),
    ).toBeVisible();
    const filaTostado = page
      .getByTestId("fila-lote")
      .filter({ hasText: nombreLote })
      .filter({ hasText: "Tostado" });
    await expect(filaTostado.getByText("4 kg")).toBeVisible();

    // Moler solo 1.5 de los 4 kg tostados
    await filaTostado.getByRole("button", { name: "Moler" }).click();
    const formMolido = page.getByTestId("form-aplicar-proceso");
    await formMolido.getByLabel("Cantidad a moler (kg)").fill("1.5");
    await formMolido.getByLabel("Merma (%)").fill("0");
    await formMolido.getByRole("button", { name: "Aplicar", exact: true }).click();

    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Tostado" }).getByText("2.5 kg"),
    ).toBeVisible();
    await expect(
      page.getByTestId("fila-lote").filter({ hasText: nombreLote }).filter({ hasText: "Molido" }).getByText("1.5 kg"),
    ).toBeVisible();
  });
});
