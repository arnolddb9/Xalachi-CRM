"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { Md3Textarea } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { formatoMoneda } from "@/lib/moneda";
import { registrarPedido, confirmarPedido, cancelarPedido, eliminarPedido } from "./actions";

type Opcion = { id: string; nombre: string };

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Borrador",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
};

type Pedido = {
  id: string;
  estado: string;
  venta_id: string | null;
  creado_en: string;
  cliente: { nombre: string } | null;
  total: number;
};

export type PedidosMd3Props = {
  pedidos: Pedido[];
  clientes: Opcion[];
  puedeEscribir: boolean;
  esAdmin: boolean;
};

export function PedidosMd3Vista({ pedidos, clientes, puedeEscribir, esAdmin }: PedidosMd3Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirmar(id: string) {
    setError(null);
    const resultado = await confirmarPedido(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleCancelar(id: string) {
    if (!window.confirm("¿Cancelar este pedido?")) return;
    setError(null);
    const resultado = await cancelarPedido(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }
  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar el pedido de "${etiqueta}" definitivamente?`)) return;
    setError(null);
    const resultado = await eliminarPedido(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Pedidos</h1>

      {error && (
        <p
          className="rounded-xl p-3 text-sm"
          style={{
            border: "1px solid var(--md-sys-color-error-container)",
            background: "color-mix(in srgb, var(--md-sys-color-error-container) 50%, transparent)",
            color: "var(--md-sys-color-error)",
          }}
        >
          {error}
        </p>
      )}

      <Md3Card>
        <div className="flex flex-wrap items-center justify-between gap-2 p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Pedidos</h2>
          {puedeEscribir && (
            <Md3Button variant={mostrarForm ? "outlined" : "filled"} minWidth={140} onClick={() => setMostrarForm((v) => !v)}>
              {mostrarForm ? "Cancelar" : "Registrar pedido"}
            </Md3Button>
          )}
        </div>

        {mostrarForm && (
          <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
            <RegistrarPedidoForm clientes={clientes} onGuardado={() => setMostrarForm(false)} />
          </div>
        )}

        <div>
          {pedidos.length === 0 && <p className="p-4 text-sm">Sin pedidos registrados.</p>}
          {pedidos.map((pedido) => {
            const etiqueta = pedido.cliente?.nombre ?? "pedido";
            return (
              <div
                key={pedido.id}
                data-testid="fila-pedido"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {pedido.cliente?.nombre ?? "Sin cliente"}{" "}
                      <Md3Chip testId="badge-estado" label={ESTADO_LABEL[pedido.estado] ?? pedido.estado} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      total {formatoMoneda(pedido.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/pedidos/${pedido.id}`}>
                      <Md3Button variant="outlined" minWidth={110}>
                        Ver detalle
                      </Md3Button>
                    </Link>
                    {pedido.estado === "confirmado" && pedido.venta_id && (
                      <Link href={`/ventas/${pedido.venta_id}`}>
                        <Md3Button variant="outlined" minWidth={90}>
                          Ver venta
                        </Md3Button>
                      </Link>
                    )}
                    {puedeEscribir && pedido.estado === "borrador" && (
                      <>
                        <Md3Button variant="outlined" minWidth={100} onClick={() => handleConfirmar(pedido.id)}>
                          Confirmar
                        </Md3Button>
                        <Md3Button variant="outlined" minWidth={90} onClick={() => handleCancelar(pedido.id)}>
                          Cancelar
                        </Md3Button>
                      </>
                    )}
                    {esAdmin && pedido.estado !== "confirmado" && (
                      <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(pedido.id, etiqueta)}>
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

function RegistrarPedidoForm({ clientes, onGuardado }: { clientes: Opcion[]; onGuardado: () => void }) {
  const [state, formAction, isPending] = useActionState(registrarPedido, {});

  useEffect(() => {
    if (state && "success" in state) onGuardado();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} data-testid="form-registrar-pedido" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Md3Select
          label="Cliente"
          name="cliente_id"
          required
          placeholder="Selecciona un cliente"
          opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
        />
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
