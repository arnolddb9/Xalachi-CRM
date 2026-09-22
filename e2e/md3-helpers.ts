import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

// Los <md-outlined-select> de @material/web no son <select> nativos, así
// que `.selectOption()` no aplica — hay que abrir el combobox y clicar la
// opción. `scope` debe ser el wrapper con data-testid="select-<name>" que
// genera Md3Select (contiene el combobox y su lista de opciones), para no
// mezclar opciones de otros selects de la misma página/formulario.
//
// Tras clicar la opción hay que esperar a que el menú termine de cerrarse
// (aria-expanded vuelve a "false"): si se sigue de inmediato con otra
// interacción, el clic puede aterrizar sobre el menú aún animándose en vez
// del siguiente campo, dejando el valor sin cambiar.
async function esperarMenuCerrado(scope: Locator) {
  await expect(scope.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
}

export async function seleccionarMd3PorTexto(scope: Locator, textoOpcion: string) {
  // El texto visible de <md-select-option> vive en su shadow DOM — no
  // cuenta para textContent/innerText del elemento en el DOM claro, así
  // que no se puede filtrar por texto visible (`.filter({ hasText })`
  // siempre da vacío). "headline" sí se refleja como atributo HTML real.
  await scope.getByRole("combobox").click();
  // `*=` (substring) en vez de `=` (exacto): varias opciones (ej. producto
  // con precio, "Nombre (₡5 000,00)") no coinciden exactamente con el
  // texto identificador que usan los tests.
  await scope.locator(`md-select-option[headline*="${textoOpcion}"]`).first().click();
  await esperarMenuCerrado(scope);
}

export async function seleccionarMd3PorIndice(scope: Locator, indice: number) {
  await scope.getByRole("combobox").click();
  await scope.locator("md-select-option").nth(indice).click();
  await esperarMenuCerrado(scope);
}
