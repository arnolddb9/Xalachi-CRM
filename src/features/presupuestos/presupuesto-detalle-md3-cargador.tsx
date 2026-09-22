"use client";

import dynamic from "next/dynamic";
import type { PresupuestoDetalleMd3Props } from "./presupuesto-detalle-md3-vista";

const PresupuestoDetalleMd3Vista = dynamic<PresupuestoDetalleMd3Props>(
  () => import("./presupuesto-detalle-md3-vista").then((m) => m.PresupuestoDetalleMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function PresupuestoDetalleMd3Cargador(props: PresupuestoDetalleMd3Props) {
  return <PresupuestoDetalleMd3Vista {...props} />;
}
