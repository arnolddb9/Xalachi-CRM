"use client";

import dynamic from "next/dynamic";
import type { PedidoDetalleMd3Props } from "./pedido-detalle-md3-vista";

const PedidoDetalleMd3Vista = dynamic<PedidoDetalleMd3Props>(
  () => import("./pedido-detalle-md3-vista").then((m) => m.PedidoDetalleMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function PedidoDetalleMd3Cargador(props: PedidoDetalleMd3Props) {
  return <PedidoDetalleMd3Vista {...props} />;
}
