// Moneda del sistema: colones costarricenses. Centralizado aquí para poder
// convertirlo en un parámetro configurable más adelante sin tocar cada vista.
export const MONEDA_SIMBOLO = "₡";

export function formatoMoneda(valor: number): string {
  return `${MONEDA_SIMBOLO}${valor.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
