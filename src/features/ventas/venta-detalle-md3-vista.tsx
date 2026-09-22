"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import "@/features/inventario/md3-theme.css";
import { Md3Card } from "@/components/md3/card";
import { formatoMoneda } from "@/lib/moneda";

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
};

type Item = {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type VentaDetalleMd3Props = {
  clienteNombre: string;
  estadoPago: string;
  notas: string | null;
  pedidoId: string | null;
  items: Item[];
  total: number;
};

export function VentaDetalleMd3Vista({ clienteNombre, estadoPago, notas, pedidoId, items, total }: VentaDetalleMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <Link href="/ventas" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
        <ArrowLeft size={16} />
        Volver a ventas
      </Link>
      <h1 className="text-2xl font-medium">Venta para {clienteNombre}</h1>
      <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Estado de pago: {ESTADO_PAGO_LABEL[estadoPago] ?? estadoPago}
        {notas ? ` · ${notas}` : ""}
      </p>

      {pedidoId && (
        <Link href={`/pedidos/${pedidoId}`} className="inline-block text-sm font-medium" style={{ color: "var(--md-sys-color-primary)" }}>
          Ver pedido origen →
        </Link>
      )}

      <Md3Card>
        <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Productos</h2>
        </div>
        <div>
          {items.length === 0 && <p className="p-4 text-sm">Sin productos en esta venta.</p>}
          {items.map((item) => (
            <div
              key={item.id}
              data-testid="fila-item-venta"
              className="flex items-center justify-between p-3 text-sm"
              style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
            >
              <span>
                {item.descripcion} — {item.cantidad} {item.unidad} × {formatoMoneda(item.precio_unitario)}
              </span>
              <span className="font-medium">{formatoMoneda(item.subtotal)}</span>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div data-testid="costo-total-venta" className="flex items-center justify-between p-4" style={{ borderTop: "1px solid var(--md-sys-color-outline-variant)" }}>
            <span className="text-sm font-semibold">Total</span>
            <span className="text-base font-semibold" style={{ color: "var(--md-sys-color-primary)" }}>
              {formatoMoneda(total)}
            </span>
          </div>
        )}
      </Md3Card>
    </div>
  );
}
