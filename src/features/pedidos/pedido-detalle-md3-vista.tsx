"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { Md3Select } from "@/components/md3/select";
import { Md3Checkbox } from "@/components/md3/checkbox";
import { formatoMoneda } from "@/lib/moneda";
import { agregarItemPedidoProducto, agregarItemPedidoGranel, eliminarItemPedido } from "./actions";

type Producto = { id: string; nombre: string; unidad_medida: string; precio_venta: number };
type LoteDisponible = { id: string; etiqueta: string; peso_actual_kg: number };
type Item = {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  motivo_cambio_precio: string | null;
  subtotal: number;
};

export type PedidoDetalleMd3Props = {
  pedidoId: string;
  clienteNombre: string;
  notas: string | null;
  estado: string;
  ventaId: string | null;
  puedeEscribir: boolean;
  productos: Producto[];
  lotes: LoteDisponible[];
  items: Item[];
  costoTotal: number;
};

export function PedidoDetalleMd3Vista({
  pedidoId,
  clienteNombre,
  notas,
  estado,
  ventaId,
  puedeEscribir,
  productos,
  lotes,
  items,
  costoTotal,
}: PedidoDetalleMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <Link href="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
        <ArrowLeft size={16} />
        Volver a pedidos
      </Link>
      <h1 className="text-2xl font-medium">Pedido para {clienteNombre}</h1>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        {notas ? notas : "Sin notas"}
      </p>

      {estado === "confirmado" && ventaId && (
        <Link href={`/ventas/${ventaId}`} className="inline-block text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
          Ver venta →
        </Link>
      )}

      {puedeEscribir && (
        <div className="space-y-3">
          <ItemPedidoProductoForm pedidoId={pedidoId} productos={productos} />
          <ItemPedidoGranelForm pedidoId={pedidoId} lotes={lotes} />
        </div>
      )}

      <Md3Card>
        <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Productos</h2>
        </div>
        <div>
          {items.length === 0 && <p className="p-4 text-sm">Sin productos agregados todavía.</p>}
          {items.map((item) => (
            <ItemPedidoRow key={item.id} item={item} puedeEscribir={puedeEscribir} />
          ))}
        </div>
        {items.length > 0 && (
          <div data-testid="costo-total-pedido" className="flex items-center justify-between p-4" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
            <span className="text-sm font-semibold">Total</span>
            <span className="text-base font-semibold" style={{ color: "var(--md-sys-color-primary)" }}>
              {formatoMoneda(costoTotal)}
            </span>
          </div>
        )}
      </Md3Card>
    </div>
  );
}

function ItemPedidoProductoForm({ pedidoId, productos }: { pedidoId: string; productos: Producto[] }) {
  const [state, formAction, isPending] = useActionState(agregarItemPedidoProducto, {});
  const [articuloId, setArticuloId] = useState("");
  const [cambiarPrecio, setCambiarPrecio] = useState(false);

  const seleccionado = productos.find((p) => p.id === articuloId) ?? null;

  return (
    <form action={formAction} data-testid="form-agregar-item-producto" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="pedido_id" value={pedidoId} />
      <Md3Select
        label="Producto"
        name="articulo_id"
        required
        value={articuloId}
        onValueChange={setArticuloId}
        placeholder="Selecciona"
        opciones={productos.map((p) => ({ value: p.id, label: `${p.nombre} (${formatoMoneda(p.precio_venta)})` }))}
      />
      <Md3TextField label={`Cantidad (${seleccionado?.unidad_medida ?? "unidades"})`} name="cantidad" type="number" step="0.01" min="0.01" required minWidth={140} />
      <Md3Checkbox id="cambiarPrecio" checked={cambiarPrecio} onCheckedChange={setCambiarPrecio} label="Cambiar precio" />
      {cambiarPrecio && (
        <>
          <Md3TextField label="Precio (₡)" name="precio_unitario" type="number" step="0.01" min="0" required defaultValue={seleccionado?.precio_venta} minWidth={120} />
          <Md3TextField label="Motivo del cambio" name="motivo_cambio_precio" required minWidth={200} />
        </>
      )}
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

function ItemPedidoGranelForm({ pedidoId, lotes }: { pedidoId: string; lotes: LoteDisponible[] }) {
  const [state, formAction, isPending] = useActionState(agregarItemPedidoGranel, {});

  return (
    <form action={formAction} data-testid="form-agregar-item-granel" className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="pedido_id" value={pedidoId} />
      <Md3Select label="Lote" name="lote_id" required placeholder="Selecciona" opciones={lotes.map((l) => ({ value: l.id, label: l.etiqueta }))} />
      <Md3TextField label="Kg" name="cantidad_kg" type="number" step="0.01" min="0.01" required minWidth={100} />
      <Md3TextField label="Precio por kg (₡)" name="precio_unitario" type="number" step="0.01" min="0.01" required minWidth={140} />
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

function ItemPedidoRow({ item, puedeEscribir }: { item: Item; puedeEscribir: boolean }) {
  async function handleEliminar() {
    if (!window.confirm("¿Eliminar este producto del pedido?")) return;
    await eliminarItemPedido(item.id);
  }

  return (
    <div
      data-testid="fila-item-pedido"
      className="flex items-center justify-between p-3 text-sm"
      style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
    >
      <span>
        {item.descripcion} — {item.cantidad} {item.unidad} × {formatoMoneda(item.precio_unitario)}
        {item.motivo_cambio_precio ? ` (precio ajustado: ${item.motivo_cambio_precio})` : ""}
      </span>
      <div className="flex items-center gap-3">
        <span className="font-medium">{formatoMoneda(item.subtotal)}</span>
        {puedeEscribir && (
          <Md3Button variant="text" minWidth={80} onClick={handleEliminar}>
            Eliminar
          </Md3Button>
        )}
      </div>
    </div>
  );
}

