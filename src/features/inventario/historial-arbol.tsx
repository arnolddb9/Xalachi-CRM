import type { NodoHistorial } from "./historial";
import { EmpacadoItem } from "./empacado-item";

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
  molido: "Molido",
};
const CALIDAD_LABEL: Record<string, string> = {
  primera: "Primera",
  segunda: "Segunda",
  tercera: "Tercera",
  rechazo: "Rechazo",
};
const TIPO_PROCESO_LABEL: Record<string, string> = {
  beneficiado: "Beneficiado",
  trillado: "Trillado",
  clasificacion_calidad: "Clasificación de calidad",
  tueste: "Tueste",
  molido: "Molido",
};

function etiquetaEtapa(etapa: string) {
  return ETAPA_LABEL[etapa] ?? etapa;
}

export function HistorialArbol({
  nodo,
  nivel = 0,
  esAdmin = false,
}: {
  nodo: NodoHistorial;
  nivel?: number;
  esAdmin?: boolean;
}) {
  return (
    <div style={{ marginLeft: nivel > 0 ? 20 : 0 }} className={nivel > 0 ? "border-l border-zinc-200 pl-4" : ""}>
      {nodo.procesoEntrada && (
        <div className="mb-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">
            {TIPO_PROCESO_LABEL[nodo.procesoEntrada.tipo_proceso] ?? nodo.procesoEntrada.tipo_proceso}
          </span>
          {nodo.procesoEntrada.proceso_beneficiado?.nombre &&
            ` (${nodo.procesoEntrada.proceso_beneficiado.nombre})`}
          {" — merma "}
          {nodo.procesoEntrada.merma_pct}%
          {nodo.procesoEntrada.usuario?.nombre && ` · ${nodo.procesoEntrada.usuario.nombre}`}
          {" · "}
          {new Date(nodo.procesoEntrada.creado_en).toLocaleString("es")}
        </div>
      )}

      <div className="mb-3 rounded-lg border border-zinc-200 bg-white p-3">
        <p className="text-sm font-medium text-zinc-900">
          {nodo.lote.nombre ?? nodo.lote.variedad?.nombre ?? "—"}{" "}
          <span className="bg-primary-soft text-primary ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
            {etiquetaEtapa(nodo.lote.etapa)}
          </span>
          {nodo.lote.calidad && (
            <span className="bg-accent-soft text-accent ml-1 rounded px-1.5 py-0.5 text-xs font-medium">
              {CALIDAD_LABEL[nodo.lote.calidad] ?? nodo.lote.calidad}
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500">
          {nodo.lote.peso_inicial_kg} kg
          {nodo.lote.cantidad_cajuelas ? ` (${nodo.lote.cantidad_cajuelas} cajuelas)` : ""}
          {nodo.lote.proveedor?.nombre ? ` · ${nodo.lote.proveedor.nombre}` : ""}
          {nodo.lote.finca?.nombre ? ` · ${nodo.lote.finca.nombre}` : ""}
          {nodo.lote.numero_cama_secado ? ` · cama ${nodo.lote.numero_cama_secado}` : ""}
          {nodo.lote.perfil_tueste?.nombre ? ` · ${nodo.lote.perfil_tueste.nombre}` : ""}
          {nodo.lote.fecha_cosecha ? ` · cosecha ${nodo.lote.fecha_cosecha}` : ""}
          {nodo.lote.peso_actual_kg > 0 && nodo.hijos.length === 0 && nodo.empacados.length === 0 && (
            <span className="text-accent"> · disponible ahora</span>
          )}
        </p>
      </div>

      {nodo.empacados.map((empacado) => (
        <EmpacadoItem key={empacado.id} empacado={empacado} esAdmin={esAdmin} />
      ))}

      {nodo.hijos.map((hijo) => (
        <HistorialArbol key={hijo.lote.id} nodo={hijo} nivel={nivel + 1} esAdmin={esAdmin} />
      ))}
    </div>
  );
}
