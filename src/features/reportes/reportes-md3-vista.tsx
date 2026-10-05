"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/features/inventario/md3-theme.css";
import { Md3Button } from "@/components/md3/button";
import { Md3Card } from "@/components/md3/card";
import { Md3TextField } from "@/components/md3/text-field";
import { formatoMoneda } from "@/lib/moneda";

export type ReportesMd3Props = {
  desde: string;
  hasta: string;
  ingresos: { ventas: number; servicios: number; total: number };
  gastos: {
    lote: number;
    insumo: number;
    producto_terminado: number;
    operativos: { categoria: string; monto: number }[];
    total: number;
  };
  resultadoCaja: number;
  pendientes: {
    ventas: { cantidad: number; monto: number };
    servicios: { cantidad: number; monto: number };
  };
};

export function ReportesMd3Vista({ desde, hasta, ingresos, gastos, resultadoCaja, pendientes }: ReportesMd3Props) {
  return (
    <div className="md3-scope space-y-4 rounded-2xl p-4">
      <h1 className="text-2xl font-medium">Reportes</h1>

      <FiltroPeriodo key={`${desde}-${hasta}`} desde={desde} hasta={hasta} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TarjetaResumen titulo="Ingresos" monto={ingresos.total} />
        <TarjetaResumen titulo="Gastos" monto={gastos.total} />
        <TarjetaResumen titulo="Resultado de caja" monto={resultadoCaja} destacar />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Md3Card style={{ padding: 16 }}>
          <h2 className="mb-2 text-sm font-semibold">Ingresos por fuente</h2>
          <FilaMonto etiqueta="Ventas (pagadas)" monto={ingresos.ventas} />
          <FilaMonto etiqueta="Servicios (pagados)" monto={ingresos.servicios} />
        </Md3Card>
        <Md3Card style={{ padding: 16 }}>
          <h2 className="mb-2 text-sm font-semibold">Gastos por tipo de compra</h2>
          <FilaMonto etiqueta="Lote" monto={gastos.lote} />
          <FilaMonto etiqueta="Insumo" monto={gastos.insumo} />
          <FilaMonto etiqueta="Producto terminado" monto={gastos.producto_terminado} />
        </Md3Card>
      </div>

      <Md3Card style={{ padding: 16 }}>
        <h2 className="mb-2 text-sm font-semibold">Gastos operativos</h2>
        {gastos.operativos.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
            Sin gastos operativos en el período.
          </p>
        ) : (
          gastos.operativos.map((g) => <FilaMonto key={g.categoria} etiqueta={g.categoria} monto={g.monto} />)
        )}
      </Md3Card>

      <Md3Card style={{ padding: 16 }}>
        <h2 className="mb-2 text-sm font-semibold">Pendientes de cobro</h2>
        <FilaMonto
          etiqueta={`Ventas pendientes (${pendientes.ventas.cantidad})`}
          monto={pendientes.ventas.monto}
        />
        <FilaMonto
          etiqueta={`Órdenes de servicio pendientes (${pendientes.servicios.cantidad})`}
          monto={pendientes.servicios.monto}
        />
      </Md3Card>

      <p className="text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        Este es un reporte de caja (ingresos vs. gastos del período, incluyendo compras y gastos operativos
        como electricidad, agua o gas): el sistema aún no registra el costo unitario de los artículos ni el
        costo heredado de los lotes, por lo que no es posible calcular una ganancia real por venta o por
        producto — solo el total de dinero que entró y salió.
      </p>
    </div>
  );
}

function TarjetaResumen({ titulo, monto, destacar }: { titulo: string; monto: number; destacar?: boolean }) {
  return (
    <Md3Card style={{ padding: 16 }}>
      <p className="mb-1 text-xs" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
        {titulo}
      </p>
      <p
        className="text-xl font-semibold"
        style={destacar ? { color: monto >= 0 ? "var(--md-sys-color-primary)" : "var(--md-sys-color-error)" } : undefined}
      >
        {formatoMoneda(monto)}
      </p>
    </Md3Card>
  );
}

function FilaMonto({ etiqueta, monto }: { etiqueta: string; monto: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span>{etiqueta}</span>
      <span className="font-medium">{formatoMoneda(monto)}</span>
    </div>
  );
}

function FiltroPeriodo({ desde, hasta }: { desde: string; hasta: string }) {
  const router = useRouter();
  const [valores, setValores] = useState({ desde, hasta });

  function aplicar() {
    const params = new URLSearchParams();
    if (valores.desde) params.set("desde", valores.desde);
    if (valores.hasta) params.set("hasta", valores.hasta);
    const query = params.toString();
    router.push(query ? `/reportes?${query}` : "/reportes");
  }
  function limpiar() {
    router.push("/reportes");
  }

  return (
    <Md3Card testId="filtro-periodo" style={{ padding: 16 }}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Md3TextField
          label="Desde"
          type="date"
          value={valores.desde}
          onValueChange={(v) => setValores((val) => ({ ...val, desde: v }))}
        />
        <Md3TextField
          label="Hasta"
          type="date"
          value={valores.hasta}
          onValueChange={(v) => setValores((val) => ({ ...val, hasta: v }))}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Md3Button onClick={aplicar} minWidth={110}>
          Filtrar
        </Md3Button>
        <Md3Button variant="outlined" onClick={limpiar} minWidth={150}>
          Mes en curso
        </Md3Button>
      </div>
    </Md3Card>
  );
}
