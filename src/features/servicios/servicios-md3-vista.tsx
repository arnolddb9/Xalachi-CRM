"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3TextField, Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import { registrarOrdenServicio, marcarOrdenEntregada, eliminarOrdenServicio, actualizarTarifasServicio } from "./actions";

type Opcion = { id: string; nombre: string };

const ETAPA_LABEL: Record<string, string> = {
  cereza: "Cereza",
  pergamino: "Pergamino",
  verde: "Verde",
  tostado: "Tostado",
};
const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  entregado: "Entregado",
};

type Orden = {
  id: string;
  etapa_entrada: string;
  cantidad_kg: number;
  estado: string;
  fecha_recepcion: string;
  fecha_entrega: string | null;
  notas: string | null;
  cliente: { nombre: string } | null;
};

type Tarifas = { pelado: number; clasificacion: number; tueste: number; molido: number; beneficiado: number };
const ETIQUETAS_TARIFA: Record<keyof Tarifas, string> = {
  beneficiado: "Beneficiado",
  pelado: "Pelado",
  clasificacion: "Clasificación",
  tueste: "Tueste",
  molido: "Molido",
};

export type ServiciosMd3Props = {
  ordenes: Orden[];
  clientes: Opcion[];
  procesosBeneficiado: Opcion[];
  factorCajuela: number;
  tarifas: Tarifas;
  puedeEscribir: boolean;
  esAdmin: boolean;
};

export function ServiciosMd3Vista({
  ordenes,
  clientes,
  procesosBeneficiado,
  factorCajuela,
  tarifas,
  puedeEscribir,
  esAdmin,
}: ServiciosMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mostrarEntregados, setMostrarEntregados] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const ordenesVisibles = mostrarEntregados ? ordenes : ordenes.filter((o) => o.estado !== "entregado");
  const cantidadEntregados = ordenes.filter((o) => o.estado === "entregado").length;

  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar la orden de servicio de "${etiqueta}" definitivamente? Esta acción no se puede deshacer.`)) return;
    setErrorEliminar(null);
    const resultado = await eliminarOrdenServicio(id);
    if ("error" in resultado && resultado.error) setErrorEliminar(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Servicios a terceros</h1>

      <TarifasServicioControl tarifas={tarifas} esAdmin={esAdmin} />

      {errorEliminar && (
        <p
          className="rounded-xl p-3 text-sm"
          style={{
            border: "1px solid var(--md-sys-color-error-container)",
            background: "color-mix(in srgb, var(--md-sys-color-error-container) 50%, transparent)",
            color: "var(--md-sys-color-error)",
          }}
        >
          {errorEliminar}
        </p>
      )}

      <Md3Card>
        <div
          className="flex flex-wrap items-center justify-between gap-2 p-4"
          style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
        >
          <h2 className="text-sm font-semibold">Órdenes de servicio</h2>
          <div className="flex flex-wrap gap-2">
            {cantidadEntregados > 0 && (
              <Md3Button variant="outlined" minWidth={140} onClick={() => setMostrarEntregados((v) => !v)}>
                {mostrarEntregados ? "Ocultar entregados" : `Ver entregados (${cantidadEntregados})`}
              </Md3Button>
            )}
            {puedeEscribir && (
              <Md3Button variant={mostrarForm ? "outlined" : "filled"} minWidth={150} onClick={() => setMostrarForm((v) => !v)}>
                {mostrarForm ? "Cancelar" : "Registrar servicio"}
              </Md3Button>
            )}
          </div>
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <RegistrarOrdenForm
              clientes={clientes}
              procesosBeneficiado={procesosBeneficiado}
              factorCajuela={factorCajuela}
              onGuardado={() => setMostrarForm(false)}
            />
          </div>
        )}

        <div>
          {ordenesVisibles.length === 0 && (
            <p className="p-4 text-sm">
              {ordenes.length === 0 ? "Sin órdenes de servicio registradas." : "Sin órdenes pendientes — todas están entregadas."}
            </p>
          )}
          {ordenesVisibles.map((orden) => {
            const etiqueta = orden.cliente?.nombre ?? "servicio";
            return (
              <div
                key={orden.id}
                data-testid="fila-servicio"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {orden.cliente?.nombre ?? "Sin cliente"}{" "}
                      <Md3Chip testId="badge-estado" label={ESTADO_LABEL[orden.estado] ?? orden.estado} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      {ETAPA_LABEL[orden.etapa_entrada] ?? orden.etapa_entrada}
                      {` · ${orden.cantidad_kg} kg`}
                      {` · recibido ${orden.fecha_recepcion}`}
                      {orden.fecha_entrega ? ` · entregado ${orden.fecha_entrega}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/servicios/${orden.id}`}>
                      <Md3Button variant="outlined" minWidth={110}>
                        Ver detalle
                      </Md3Button>
                    </Link>
                    {puedeEscribir && orden.estado !== "entregado" && (
                      <Md3Button variant="outlined" minWidth={150} onClick={() => marcarOrdenEntregada(orden.id)}>
                        Marcar entregado
                      </Md3Button>
                    )}
                    {esAdmin && (
                      <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(orden.id, etiqueta)}>
                        Eliminar
                      </Md3Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Md3Card>
    </div>
  );
}

function RegistrarOrdenForm({
  clientes,
  procesosBeneficiado,
  factorCajuela,
  onGuardado,
}: {
  clientes: Opcion[];
  procesosBeneficiado: Opcion[];
  factorCajuela: number;
  onGuardado: () => void;
}) {
  const [state, formAction, isPending] = useActionState(registrarOrdenServicio, {});
  const [etapaEntrada, setEtapaEntrada] = useState<"cereza" | "pergamino" | "verde" | "tostado">("verde");
  const [cajuelas, setCajuelas] = useState("");
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const pesoEstimado = etapaEntrada === "cereza" && cajuelas ? Number(cajuelas) * factorCajuela : null;

  return (
    <form action={formAction} data-testid="form-registrar-servicio" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Cliente"
          name="cliente_id"
          required
          placeholder="Selecciona un cliente"
          opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
        />
        <Md3Select
          label="Etapa en la que llega el café"
          name="etapa_entrada"
          required
          value={etapaEntrada}
          onValueChange={(v) => setEtapaEntrada(v as typeof etapaEntrada)}
          opciones={[
            { value: "cereza", label: "Cereza" },
            { value: "pergamino", label: "Pergamino" },
            { value: "verde", label: "Verde" },
            { value: "tostado", label: "Tostado" },
          ]}
        />

        {etapaEntrada === "cereza" ? (
          <>
            <Md3Select
              label="Proceso de beneficiado"
              name="proceso_beneficiado_id"
              required
              placeholder="Selecciona un proceso"
              opciones={procesosBeneficiado.map((p) => ({ value: p.id, label: p.nombre }))}
            />
            <Md3TextField
              label="Cajuelas recibidas"
              name="cantidad_cajuelas"
              type="number"
              step="0.1"
              min="0.1"
              required
              value={cajuelas}
              onValueChange={setCajuelas}
              supportingText={
                pesoEstimado !== null
                  ? `≈ ${pesoEstimado.toFixed(2)} kg (${factorCajuela} kg/cajuela)`
                  : `Factor actual: ${factorCajuela} kg por cajuela`
              }
            />
          </>
        ) : (
          <Md3TextField label="Cantidad recibida (kg)" name="cantidad_kg" type="number" step="0.01" min="0.01" required />
        )}

        <Md3TextField label="Fecha de recepción" name="fecha_recepcion" type="date" defaultValue={hoy} />
        <Md3Textarea label="Notas (opcional)" name="notas" />
      </div>

      {state && "error" in state && state.error && (
        <p className="text-sm" style={{ color: "var(--md-sys-color-error)" }}>
          {state.error}
        </p>
      )}

      <Md3Button type="submit" disabled={isPending} minWidth={120}>
        {isPending ? "Guardando..." : "Guardar"}
      </Md3Button>
    </form>
  );
}

function TarifasServicioControl({ tarifas, esAdmin }: { tarifas: Tarifas; esAdmin: boolean }) {
  const [editando, setEditando] = useState(false);
  const [state, formAction, isPending] = useActionState(actualizarTarifasServicio, {});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cierra el form tras un submit exitoso
    if (state && "success" in state) setEditando(false);
  }, [state]);

  if (!editando) {
    return (
      <Md3Card style={{ padding: 12 }}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            Tarifas por kg:{" "}
            {(Object.keys(ETIQUETAS_TARIFA) as (keyof Tarifas)[])
              .map((k) => `${ETIQUETAS_TARIFA[k]} ${formatoMoneda(tarifas[k])}`)
              .join(" · ")}
          </span>
          {esAdmin && (
            <Md3Button variant="text" minWidth={80} onClick={() => setEditando(true)}>
              Ajustar
            </Md3Button>
          )}
        </div>
      </Md3Card>
    );
  }

  return (
    <Md3Card style={{ padding: 12 }}>
      <form action={formAction} data-testid="form-tarifas-servicio" className="flex flex-wrap items-end gap-3">
        {(Object.keys(ETIQUETAS_TARIFA) as (keyof Tarifas)[]).map((k) => (
          <Md3TextField key={k} label={`${ETIQUETAS_TARIFA[k]} (₡/kg)`} name={k} type="number" step="0.01" min="0" required defaultValue={tarifas[k]} minWidth={120} />
        ))}
        <Md3Button type="submit" disabled={isPending} minWidth={100}>
          Guardar
        </Md3Button>
        <Md3Button type="button" variant="outlined" minWidth={100} onClick={() => setEditando(false)}>
          Cancelar
        </Md3Button>
        {state && "error" in state && state.error && (
          <p className="w-full text-sm" style={{ color: "var(--md-sys-color-error)" }}>
            {state.error}
          </p>
        )}
      </form>
    </Md3Card>
  );
}
