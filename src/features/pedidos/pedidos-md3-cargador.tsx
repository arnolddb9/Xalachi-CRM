"use client";

import dynamic from "next/dynamic";
import type { PedidosMd3Props } from "./pedidos-md3-vista";

const PedidosMd3Vista = dynamic<PedidosMd3Props>(
  () => import("./pedidos-md3-vista").then((m) => m.PedidosMd3Vista),
  { ssr: false, loading: () => <p className="p-4 text-sm text-zinc-500">Cargando…</p> },
);

export function PedidosMd3Cargador(props: PedidosMd3Props) {
  return <PedidosMd3Vista {...props} />;
}
