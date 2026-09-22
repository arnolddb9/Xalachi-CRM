"use client";

import { useState } from "react";
import Link from "next/link";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3Chip } from "@/components/md3/chip";
import { formatoMoneda } from "@/lib/moneda";
import { marcarVentaPagada, eliminarVenta } from "./actions";

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
};

type Venta = {
  id: string;
  estado_pago: string;
  creado_en: string;
  cliente: { nombre: string } | null;
  total: number;
};

export type VentasMd3Props = {
  ventas: Venta[];
  puedeEscribir: boolean;
  esAdmin: boolean;
};

export function VentasMd3Vista({ ventas, puedeEscribir, esAdmin }: VentasMd3Props) {
  const [error, setError] = useState<string | null>(null);

  async function handleMarcarPagada(id: string) {
    setError(null);
    const resultado = await marcarVentaPagada(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  async function handleEliminar(id: string, etiqueta: string) {
    if (!window.confirm(`¿Eliminar la venta de "${etiqueta}" definitivamente? Se revertirá el inventario descontado.`)) return;
    setError(null);
    const resultado = await eliminarVenta(id);
    if ("error" in resultado && resultado.error) setError(resultado.error);
  }

  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Ventas</h1>

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
        <div className="p-4" style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <h2 className="text-sm font-semibold">Ventas</h2>
        </div>
        <div>
          {ventas.length === 0 && <p className="p-4 text-sm">Sin ventas registradas.</p>}
          {ventas.map((venta) => {
            const etiqueta = venta.cliente?.nombre ?? "venta";
            return (
              <div
                key={venta.id}
                data-testid="fila-venta"
                className="p-4"
                style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="mb-1 text-sm font-medium">
                      {venta.cliente?.nombre ?? "Sin cliente"}{" "}
                      <Md3Chip testId="badge-estado-pago" label={ESTADO_PAGO_LABEL[venta.estado_pago] ?? venta.estado_pago} />
                    </p>
                    <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
                      total {formatoMoneda(venta.total)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/ventas/${venta.id}`}>
                      <Md3Button variant="outlined" minWidth={110}>
                        Ver detalle
                      </Md3Button>
                    </Link>
                    {puedeEscribir && venta.estado_pago === "pendiente" && (
                      <Md3Button variant="outlined" minWidth={140} onClick={() => handleMarcarPagada(venta.id)}>
                        Marcar pagada
                      </Md3Button>
                    )}
                    {esAdmin && (
                      <Md3Button variant="outlined" minWidth={100} onClick={() => handleEliminar(venta.id, etiqueta)}>
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
