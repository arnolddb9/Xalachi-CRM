"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import { agregarItemPresupuesto, eliminarItemPresupuesto } from "./actions";
import { CompartirPresupuestoBoton } from "./compartir-presupuesto-boton";

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
};
const TIPO_PROCESO_LABEL: Record<string, string> = {
  beneficiado: "Beneficiado",
  pelado: "Pelado",
  clasificacion: "Clasificación",
  tueste: "Tueste",
  molido: "Molido",
};

type Item = {
  id: string;
  tipo_proceso: string;
  kg_estimado: number;
  tarifa_kg: number;
  costo_estimado: number;
};

export type PresupuestoDetalleMd3Props = {
  presupuestoId: string;
  clienteNombre: string;
  etapaEntrada: string;
  cantidadKg: number | null;
  cantidadCajuelas: number | null;
  procesoBeneficiadoNombre: string | null;
  notas: string | null;
  estado: string;
  ordenServicioId: string | null;
  puedeEscribir: boolean;
  pesoEstimadoCereza: number | null;
  items: Item[];
  costoTotal: number;
};

export function PresupuestoDetalleMd3Vista({
  presupuestoId,
  clienteNombre,
  etapaEntrada,
  cantidadKg,
  cantidadCajuelas,
  procesoBeneficiadoNombre,
  notas,
  estado,
  ordenServicioId,
  puedeEscribir,
  pesoEstimadoCereza,
  items,
  costoTotal,
}: PresupuestoDetalleMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <Link href="/presupuestos" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
        <ArrowLeft size={16} />
        Volver a presupuestos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-medium">Presupuesto para {clienteNombre}</h1>
        <CompartirPresupuestoBoton
          clienteNombre={clienteNombre}
          etapaEntrada={etapaEntrada}
          cantidadKg={cantidadKg}
          cantidadCajuelas={cantidadCajuelas}
          procesoBeneficiadoNombre={procesoBeneficiadoNombre}
          notas={notas}
          estado={estado}
          items={items}
          costoTotal={costoTotal}
        />
      </div>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        {ETAPA_LABEL[etapaEntrada] ?? etapaEntrada}
        {cantidadCajuelas ? ` · ${cantidadCajuelas} cajuelas` : ""}
        {cantidadKg ? ` · ${cantidadKg} kg` : ""}
        {procesoBeneficiadoNombre ? ` · ${procesoBeneficiadoNombre}` : ""}
        {notas ? ` · ${notas}` : ""}
      </p>

      {estado === "aprobado" && ordenServicioId && (
        <Link href={`/servicios/${ordenServicioId}`} className="inline-block text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
          Ver orden de servicio →
        </Link>
      )}

      {puedeEscribir && <ItemPresupuestoForm presupuestoId={presupuestoId} pesoEstimadoCereza={pesoEstimadoCereza} />}

      <Md3Card>
        <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Procesos estimados</h2>
        </div>
        <div>
          {items.length === 0 && <p className="p-4 text-sm">Sin procesos agregados todavía.</p>}
          {items.map((item) => (
            <ItemPresupuestoRow key={item.id} item={item} puedeEscribir={puedeEscribir} />
          ))}
        </div>
        {items.length > 0 && (
          <div data-testid="costo-total-presupuesto" className="flex items-center justify-between p-4" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
            <span className="text-sm font-semibold">Total estimado</span>
            <span className="text-base font-semibold" style={{ color: "var(--md-sys-color-primary)" }}>
              {formatoMoneda(costoTotal)}
            </span>
          </div>
        )}
      </Md3Card>
    </div>
  );
}

function ItemPresupuestoForm({ presupuestoId, pesoEstimadoCereza }: { presupuestoId: string; pesoEstimadoCereza: number | null }) {
  const [state, formAction, isPending] = useActionState(agregarItemPresupuesto, {});
  const [tipoProceso, setTipoProceso] = useState("");
  const [kgEstimado, setKgEstimado] = useState("");

  function alCambiarTipoProceso(valor: string) {
    setTipoProceso(valor);
    if (valor === "beneficiado" && pesoEstimadoCereza) {
      setKgEstimado(String(pesoEstimadoCereza));
    }
  }

  return (
    <form action={formAction} data-testid="form-agregar-item-presupuesto" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="presupuesto_id" value={presupuestoId} />
      <Md3Select
        label="Proceso"
        name="tipo_proceso"
        required
        value={tipoProceso}
        onValueChange={alCambiarTipoProceso}
        placeholder="Selecciona"
        opciones={Object.entries(TIPO_PROCESO_LABEL).map(([value, label]) => ({ value, label }))}
      />
      <Md3TextField
        label="Kg estimados"
        name="kg_estimado"
        type="number"
        step="0.01"
        min="0.01"
        required
        value={kgEstimado}
        onValueChange={setKgEstimado}
        minWidth={120}
        supportingText={tipoProceso === "beneficiado" && pesoEstimadoCereza ? `≈ ${pesoEstimadoCereza.toFixed(2)} kg según las cajuelas` : undefined}
      />
      <Md3Button type="submit" disabled={isPending} minWidth={100}>
        {isPending ? "Agregando..." : "Agregar"}
      </Md3Button>
      {state && "error" in state && state.error && (
        <p className="w-full text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}

function ItemPresupuestoRow({ item, puedeEscribir }: { item: Item; puedeEscribir: boolean }) {
  async function handleEliminar() {
    if (!window.confirm("¿Eliminar este proceso estimado del presupuesto?")) return;
    await eliminarItemPresupuesto(item.id);
  }

  return (
    <div
      data-testid="fila-item-presupuesto"
      className="flex items-center justify-between p-3 text-sm"
      style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
    >
      <span>
        {TIPO_PROCESO_LABEL[item.tipo_proceso] ?? item.tipo_proceso} — {item.kg_estimado} kg × {formatoMoneda(item.tarifa_kg)}/kg
      </span>
      <div className="flex items-center gap-3">
        <span className="font-medium">{formatoMoneda(item.costo_estimado)}</span>
        {puedeEscribir && (
          <Md3Button variant="text" minWidth={80} onClick={handleEliminar}>
            Eliminar
          </Md3Button>
        )}
      </div>
    </div>
  );
}
