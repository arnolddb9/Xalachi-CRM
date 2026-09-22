"use client";

import dynamic from "next/dynamic";
import type { VentaDetalleMd3Props } from "./venta-detalle-md3-vista";

const VentaDetalleMd3Vista = dynamic<VentaDetalleMd3Props>(
  () => import("./venta-detalle-md3-vista").then((m) => m.VentaDetalleMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function VentaDetalleMd3Cargador(props: VentaDetalleMd3Props) {
  return <VentaDetalleMd3Vista {...props} />;
}
