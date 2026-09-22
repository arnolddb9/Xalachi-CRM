// La fuente estándar de jsPDF (WinAnsi) no incluye el símbolo ₡ — en el PDF
// se usa el prefijo "CRC" para no arriesgar un glifo roto o vacío. La
// pantalla sigue usando formatoMoneda (con ₡) de src/lib/moneda.ts.
export function formatoMonedaPdf(valor: number): string {
  return `CRC ${valor.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const TIPO_PROCESO_LABEL: Record<string, string> = {
  beneficiado: "Beneficiado",
  pelado: "Pelado",
  clasificacion: "Clasificación",
  tueste: "Tueste",
  molido: "Molido",
};

export const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
  molido: "Molido",
};

export const CALIDAD_LABEL: Record<string, string> = {
  primera: "Primera",
  segunda: "Segunda",
  tercera: "Tercera",
  rechazo: "Rechazo",
};
